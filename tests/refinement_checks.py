"""Regression checks and visual evidence for the hero refinement. Server: :5173."""
from pathlib import Path
import json, math, os
from playwright.sync_api import sync_playwright

OUT = Path('test-results/refinement')
OUT.mkdir(parents=True, exist_ok=True)
report = []
def state(page): return page.evaluate('window.portfolio.inspect()')
def distance(a, b): return math.hypot(a['x'] - b['x'], a['y'] - b['y'])
def wait(page, ms=1100): page.wait_for_timeout(ms)
def selected(page, expected=None):
    s = state(page)
    assert s['active'] and (expected is None or s['active'] == expected)
    dots = page.locator('.content-dot').evaluate_all('els=>els.map(e=>({id:e.dataset.id,fill:getComputedStyle(e).fill,r:parseFloat(getComputedStyle(e).r)}))')
    active = next(dot for dot in dots if dot['id'] == s['active'])
    expected_color = 'rgb(161, 138, 195)' if s['active'] == 'self' else 'rgb(201, 139, 97)'
    assert active['fill'] == expected_color, active
    assert page.locator('.destination[aria-current="true"]').count() == 1
    return s
def load(page, query='?demo'):
    page.goto('http://127.0.0.1:5173/' + query)
    page.wait_for_load_state('networkidle')
    wait(page)
def passed(name, details=None):
    report.append({'check': name, 'details': details})
    print('PASS', name, flush=True)
def empty(page):
    return page.evaluate('''() => {
      for (const y of [20, 90, innerHeight-90]) for (const x of [20, 90, innerWidth-90]) {
        const el = document.elementFromPoint(x,y);
        if (el?.closest('#graph') && !el.closest('.destination')) return {x,y};
      }
      throw new Error('No empty graph point');
    }''')

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=os.getenv('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe'))
    page = browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    load(page)
    s=selected(page,'self')
    assert 'self' in [p['id'] for p in s['visible']]
    assert page.locator('#center-title').text_content()=='KAAN BILGE'
    assert page.locator('#center-description').text_content()=='Software, mathematics, and things made out of curiosity.'
    radii=page.locator('.content-dot').evaluate_all('els=>els.map(e=>({id:e.dataset.id,r:parseFloat(getComputedStyle(e).r)}))')
    assert all(abs(d['r']-(4.95 if d['id']=='self' else 2.475))<0.001 for d in radii)
    page.screenshot(path=str(OUT/'initial.png'))
    passed('SELF is visible and selected on load; base radius +37.5%, selected radius 2x')

    # Choose a project with close structural neighbors, then inspect the actual
    # rendered geometry while sampling every frame through its growth.
    q=min((q for q in s['visible'] if q['id']!='self'),
          key=lambda q:min(distance(q,p) for p in s['structuralPoints']))
    before={p['id']:p for p in s['structuralPoints']+s['points']}
    page.mouse.move(q['x'],q['y'])
    page.wait_for_function('(id)=>window.portfolio.inspect().active===id',arg=q['id'])
    center=next(p for p in state(page)['points'] if p['id']==q['id'])
    sampled=[]
    for _ in range(14):
        now=selected(page,q['id'])
        assert distance(center,next(p for p in now['points'] if p['id']==q['id']))<0.001
        sampled.append(page.locator(f'.content-dot[data-id="{q["id"]}"]').evaluate('e=>parseFloat(getComputedStyle(e).r)'))
        page.wait_for_timeout(35)
    assert sampled[0]<4.9 and sampled[-1]>4.94, sampled
    assert all(a<=b for a,b in zip(sampled,sampled[1:])),sampled
    wait(page)
    after=state(page)
    moved=[]
    for p in after['structuralPoints']+after['points']:
        old=before.get(p['id'])
        if old and distance(old,center)<155 and p['id']!=q['id'] and distance(old,p)>0.3:
            assert distance(p,center)>distance(old,center)-0.01
            moved.append({'id':p['id'],'displacement':distance(old,p)})
    assert moved, 'No local graph displacement was visible'
    assert after['positions']==s['positions']
    page.screenshot(path=str(OUT/'selected-physics.png'))
    page.mouse.move(5,5);wait(page)
    selected(page,q['id'])
    assert not state(page)['physicsRunning']
    passed('One active node through smooth growth; category color retained; selected center pinned; local mesh and edges displaced',moved)

    far=max((p for p in after['visible'] if p['id']!=q['id']),key=lambda p:distance(p,q))
    # Approaching a normal node must not exert pointer forces.
    quiet=state(page)['offsets']
    page.mouse.move(far['x']+28,far['y']);wait(page,250)
    assert state(page)['offsets']==quiet
    selected(page,q['id'])
    page.mouse.move(far['x'],far['y']);wait(page)
    selected(page,far['id'])
    settled=state(page)
    for item in moved:
        old=before[item['id']]
        if distance(old,far)>175:
            offset=settled['offsets'].get(item['id'],{'x':0,'y':0})
            assert math.hypot(offset['x'],offset['y'])==0
    assert not settled['physicsRunning']
    assert settled['positions']==s['positions']
    page.mouse.move(5,5);wait(page)
    frozen=state(page)['offsets'];wait(page,1600)
    assert state(page)['offsets']==frozen
    passed('Old neighborhood returns exactly to rest; no cursor repulsion, accumulated layout change or idle simulation')

    load(page)
    original=page.locator('#center-title tspan').evaluate_all('els=>els.map(e=>({text:e.textContent,x:e.getAttribute("x"),y:e.getAttribute("y")}))')
    glyph=page.locator('#center-title tspan').first.evaluate('e=>{const b=e.getExtentOfChar(2);return {x:b.x+b.width*.28,y:b.y+b.height*.55}}')
    page.mouse.move(glyph['x'],glyph['y']);wait(page,600)
    transforms=page.locator('#center-title tspan').first.evaluate('e=>({dx:e.getAttribute("dx"),dy:e.getAttribute("dy"),r:e.getAttribute("rotate")})')
    assert transforms['dx'] and transforms['r'], transforms
    rotations=list(map(float,transforms['r'].split()))
    assert 0.1<max(map(abs,rotations))<=1.6
    shifts=list(map(float,transforms['dx'].split()))
    assert max(abs(sum(shifts[:i+1])) for i in range(len(shifts)))<=2.5
    assert page.locator('#type-mask-text .title-mask tspan').first.get_attribute('rotate')==transforms['r']
    page.screenshot(path=str(OUT/'glyph-response.png'))
    page.mouse.move(5,5);wait(page)
    assert page.locator('#center-title tspan[dx],#center-title tspan[dy],#center-title tspan[rotate]').count()==0
    restored=page.locator('#center-title tspan').evaluate_all('els=>els.map(e=>({text:e.textContent,x:e.getAttribute("x"),y:e.getAttribute("y")}))')
    assert restored==original
    passed('Independent restrained glyph offsets/rotation, matching masks, exact typography restoration',transforms)

    boundary=[]
    for width,height in [(1440,900),(390,844),(2560,1195)]:
        # Also exercises expanding an existing finite field after resize.
        page.set_viewport_size({'width':width,'height':height})
        load(page)
        assert 'self' in [p['id'] for p in selected(page,'self')['visible']]
        e=empty(page);page.mouse.move(e['x'],e['y'])
        for _ in range(10): page.mouse.wheel(0,600)
        wait(page)
        assert state(page)['camera']['scale']==0.65
        for name,dx,dy in [('left',-20000,0),('right',20000,0),('top',0,-20000),('bottom',0,20000),
                           ('top-left',-20000,-20000),('top-right',20000,-20000),('bottom-left',-20000,20000),('bottom-right',20000,20000)]:
            # Repeated real drags wholly inside the viewport: headless Chrome
            # does not reliably deliver a mouse-up thousands of pixels outside.
            sx=width-30 if dx<0 else 30 if dx>0 else width/2
            sy=height-90 if dy<0 else 30 if dy>0 else 40
            ex=30 if dx<0 else width-30 if dx>0 else sx
            ey=30 if dy<0 else height-90 if dy>0 else sy
            for _ in range(8):
                previous=state(page)['camera']
                page.mouse.move(sx,sy);page.mouse.down()
                page.mouse.move(ex,ey,steps=8);page.mouse.up();wait(page,140)
                if state(page)['camera']==previous: break
            current=selected(page);c=current['camera'];b=current['fieldBounds']
            world=current['worldBounds']
            if dx:
                expected=width*.25-world['left']*.65 if dx>0 else -width*.25-world['right']*.65
                assert abs(c['x']-expected)<.01,(name,c,expected)
            if dy:
                expected=height*.25-world['top']*.65 if dy>0 else -height*.25-world['bottom']*.65
                assert abs(c['y']-expected)<.01,(name,c,expected)
            assert width/2+c['x']+b['left']*.65<=-200
            assert width/2+c['x']+b['right']*.65>=width+200
            assert height/2+c['y']+b['top']*.65<=-200
            assert height/2+c['y']+b['bottom']*.65>=height+200
            mesh=current['structuralPoints']
            strips=[sum(p['x']<150 for p in mesh),sum(p['x']>width-150 for p in mesh),
                    sum(p['y']<150 for p in mesh),sum(p['y']>height-150 for p in mesh)]
            assert min(strips)>0,(width,height,name,strips)
            boundary.append({'viewport':[width,height],'pan':name,'camera':c,'edgeSamples':strips})
            page.screenshot(path=str(OUT/f'boundary-{width}-{name}.png'))
    passed('Minimum zoom: every horizontal, vertical and diagonal extreme is covered, including resize',boundary)

    page.set_viewport_size({'width':1440,'height':900});load(page,'')
    selected(page,'self');page.screenshot(path=str(OUT/'real-self.png'))
    page.emulate_media(reduced_motion='reduce')
    load(page)
    q=next(p for p in state(page)['visible'] if p['id']!='self')
    page.mouse.move(q['x'],q['y']);wait(page,150)
    selected(page,q['id'])
    assert all(not o['x'] and not o['y'] for o in state(page)['offsets'].values())
    assert page.locator('#center-title tspan[dx]').count()==0
    passed('Production content uses the SELF data node; reduced motion keeps selection without displacement')
    assert not errors,errors
    (OUT/'report.json').write_text(json.dumps({'passed':report,'pageErrors':errors},indent=2))
    browser.close()
