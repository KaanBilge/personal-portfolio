"""Behavioral acceptance tests against an already-running local Vite server.
Run: python tests/browser_checks.py [--quick] (quick skips the 30s idle check).
Uses installed Chrome, or CHROME_PATH; no personal browser profile is opened.
"""
from pathlib import Path
import json, os, sys, math
from playwright.sync_api import sync_playwright

URL='http://127.0.0.1:5173/'
OUT=Path('test-results');OUT.mkdir(exist_ok=True)
results=[]
def check(name,fn):
    fn();results.append(name);print('PASS',name,flush=True)
def state(page):return page.evaluate('window.portfolio.inspect()')
def wait(page,ms=420):page.wait_for_timeout(ms)
def inspected(page):page.wait_for_function('document.querySelector("#scenes").dataset.scene === "detail"')
def return_to_graph(page):
    page.locator('#inspect-handle').click()
    page.wait_for_function('document.querySelector("#scenes").dataset.scene === "graph"')
def near(a,b,t=.5):assert abs(a-b)<=t,(a,b)
def idle(page):
    page.mouse.move(5,5);page.locator('body').click(position={'x':5,'y':5});wait(page)
def data(page,n=22,hub=False):
    return page.evaluate('''async ({n,hub}) => (await import('/src/demo-data.js')).demonstrationData(n,hub)''',{'n':n,'hub':hub})

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.getenv('CHROME_PATH',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),headless=True)
    errors=[]
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    def load(query='?demo'):
        page.goto(URL+query);page.wait_for_load_state('networkidle')
    load()
    def initial():
        s=state(page);assert len(s['points'])==23 and 'self' in [p['id'] for p in s['visible']]
        near(s['titleBounds']['right']-s['titleBounds']['left'],663.94,.2)
        assert page.locator('.destination[tabindex="0"]').count()==1
        assert page.locator('#social a').count()==0
        assert page.evaluate('document.fonts.check(\'96px "STIX Two Text"\')')
        before=s['positions'];wait(page,30000 if '--quick' not in sys.argv else 400)
        assert state(page)['positions']==before and state(page)['active'] is not None
    check('Variant A, named links, isolated demo, and stable idle',initial)
    def hover():
        target=next(q for q in state(page)['visible'] if q['id']!='self');x,y=target['x'],target['y']
        page.mouse.move(x+30,y);wait(page,130);assert state(page)['active'] is not None
        page.mouse.move(x+8,y);wait(page,800)
        assert state(page)['active']==target['id']
        assert page.locator('#center-title').text_content()=='PROJECT NAME'
        assert page.locator('#center-description').text_content()=='One-line project description.'
        styles=page.locator('.content-dot').evaluate_all('(els)=>els.map(e=>({fill:getComputedStyle(e).fill,r:getComputedStyle(e).r}))')
        assert sum(s['fill']=='rgb(201, 139, 97)' for s in styles)==1
        active=next(s for s in styles if s['fill']=='rgb(201, 139, 97)');assert active['r']=='4.95px'
        near(state(page)['titleBounds']['right']-state(page)['titleBounds']['left'],447.5,.2)
        page.screenshot(path=str(OUT/'hover.png'))
        page.mouse.move(x+70,y);page.mouse.move(x+80,y);wait(page)
        assert state(page)['active'] is not None and page.locator('#center-title').text_content()=='PROJECT NAME'
        points=state(page)['visible'][:5]
        for q in points:page.mouse.move(q['x'],q['y']);wait(page,12)
        page.mouse.move(5,5);wait(page)
        assert state(page)['active'] is not None
    check('Proximity, dwell, amber neighborhood, persistent selection and rapid sweep',hover)
    def camera():
        load();before=state(page);point=next(q for q in before['visible'] if q['id']!='self')
        page.mouse.move(80,80);page.mouse.down();page.mouse.move(83,82);assert state(page)['camera']==before['camera']
        page.mouse.move(160,130,steps=5);page.mouse.up();after=state(page)
        near(after['camera']['x'],80);near(after['camera']['y'],50)
        wait(page,250);assert state(page)['camera']==after['camera'];assert state(page)['positions']==before['positions']
        assert state(page)['titleBounds']==before['titleBounds']
        point=next(q for q in state(page)['visible'] if q['id']!='self');page.mouse.move(point['x'],point['y']);page.mouse.down();page.mouse.move(point['x']+60,point['y']+35,steps=5);page.mouse.up();wait(page)
        assert page.url.endswith('?demo');near(state(page)['camera']['x'],140)
        page.mouse.move(100,100);old=state(page)['camera'];anchor={'x':100,'y':100}
        world={'x':(100-720-old['x'])/old['scale'],'y':(100-450-old['y'])/old['scale']}
        page.mouse.wheel(0,-100);wait(page,180);new=state(page)['camera'];near(new['scale']/old['scale'],1.1,.002)
        near(720+new['x']+world['x']*new['scale'],100,.01);near(450+new['y']+world['y']*new['scale'],100,.01)
        page.mouse.move(720,440);old=state(page)['camera'];page.mouse.wheel(0,100);wait(page,180);assert state(page)['camera']==old
        consumed=page.evaluate('''()=>{const e=new WheelEvent('wheel',{deltaY:100,ctrlKey:true,bubbles:true,cancelable:true});document.querySelector('#graph').dispatchEvent(e);return e.defaultPrevented;}''')
        assert consumed is False
        page.mouse.move(20,20)
        for _ in range(20):page.mouse.wheel(0,-400)
        wait(page,180);near(state(page)['camera']['scale'],2.4,.001)
        assert page.locator('.content-dot:not([data-id="self"])').first.evaluate('(e)=>getComputedStyle(e).r')=='2.475px'
    check('Pan thresholds, node drag, no inertia, anchored zoom and browser gestures',camera)
    def keyboard():
        load();page.keyboard.press('Tab');wait(page)
        s=state(page);assert s['owner']=='keyboard' and s['active']==s['focused']
        assert page.locator('#dots circle[visibility="visible"][fill="none"]').count()==1
        first=s['focused'];page.keyboard.press(']');wait(page);assert state(page)['focused']!=first
        page.keyboard.press('ArrowRight');wait(page)
        assert state(page)['active']==state(page)['focused']
        page.keyboard.press('+');wait(page);near(state(page)['camera']['scale'],1.15,.001)
        page.keyboard.press('Home');wait(page);assert state(page)['camera']=={'x':0,'y':0,'scale':1}
        page.keyboard.press(']');wait(page);selected=state(page)['active'];title=page.locator('#center-title').text_content()
        page.keyboard.press('Escape');wait(page)
        assert state(page)['active']==selected and page.locator('#center-title').text_content()==title
        page.keyboard.press('Tab');wait(page);assert not page.evaluate("document.activeElement.classList.contains('destination')")
        page.keyboard.press('Shift+Tab');wait(page);assert state(page)['focused']==first
        page.keyboard.press(']');wait(page);page.keyboard.press('Enter');inspected(page)
        assert page.url.endswith('?demo')
    check('Single Tab entry, arrows, ordered browsing, zoom, Escape, Tab exit and Enter',keyboard)
    def navigation():
        load();page.mouse.move(80,80);page.mouse.down();page.mouse.move(170,110);page.mouse.up();wait(page)
        camera=state(page)['camera'];q=next(q for q in state(page)['visible'] if q['id']!='self')
        page.mouse.move(q['x'],q['y']);wait(page)
        page.mouse.click(q['x'],q['y']);inspected(page)
        return_to_graph(page);wait(page)
        assert state(page)['camera']==camera and state(page)['active']==q['id']
        q=next(q for q in state(page)['visible'] if q['id']!='self')
        page.keyboard.down('Control')
        page.mouse.move(q['x'],q['y']);wait(page);page.mouse.click(q['x'],q['y'])
        page.keyboard.up('Control')
        inspected(page);assert len(page.context.pages)==1
        return_to_graph(page)
        page.mouse.click(q['x'],q['y'],button='middle');assert len(page.context.pages)==1
    check('Node and modifier click inspect internally; middle click cannot bypass detail; camera restores',navigation)
    def density_and_data():
        load();before=state(page)
        page.evaluate('window.portfolio.setDensity(.5)');low=state(page)
        page.evaluate('window.portfolio.setDensity(1.6)');high=state(page)
        assert low['structuralVertices']<before['structuralVertices']<high['structuralVertices']
        assert low['positions']==before['positions']==high['positions']
        original=data(page,22);new=data(page,23);q=next(q for q in state(page)['visible'] if q['id']!='self')
        page.mouse.move(q['x'],q['y']);wait(page)
        page.evaluate('d=>window.portfolio.setContent(d)',new);assert state(page)['pending'] and len(state(page)['points'])==23
        page.mouse.move(5,5);wait(page,550);assert len(state(page)['points'])==24
        assert all(state(page)['positions'][key]==val for key,val in before['positions'].items())
        page.evaluate('d=>window.portfolio.setContent(d)',original)
        assert len(state(page)['points'])==23
        q=next(q for q in state(page)['visible'] if q['id']!='self');page.mouse.move(q['x'],q['y']);wait(page)
        camera=state(page)['camera'];page.evaluate('d=>window.portfolio.setContent(d)',[n for n in original if n['id']!=q['id']])
        assert state(page)['active'] is not None and len(state(page)['points'])==22 and state(page)['camera']==camera
        page.mouse.move(5,5);page.keyboard.press('Tab');wait(page)
        active=state(page)['active'];camera=state(page)['camera']
        remaining=[n for n in original if n['id'] not in [q['id'],active]]
        page.evaluate('d=>window.portfolio.setContent(d)',remaining)
        assert state(page)['active'] is not None and state(page)['camera']==camera
        assert 'no longer available' in page.locator('#announcement').text_content()
        page.keyboard.press('Tab');wait(page)
        for n in [0,5,30,100,250]:
            page.evaluate('d=>window.portfolio.setContent(d)',data(page,n,True));wait(page,200)
            s=state(page);assert len(s['points'])==n+1 and page.locator('.destination').count()==n+1
            page.screenshot(path=str(OUT/f'data-{n}.png'))
        # The new persistent handle adds a Tab stop. Enter the graph explicitly
        # before verifying the existing complete ordered traversal.
        page.locator('.destination[tabindex="0"]').focus();wait(page)
        visited=set()
        page.emulate_media(reduced_motion='reduce')
        for _ in range(251):
            page.keyboard.press(']');s=state(page);visited.add(s['focused']);q=next(p for p in s['points'] if p['id']==s['focused'])
            assert 47<=q['x']<=1393 and 47<=q['y']<=853
            assert s['focused'] in [p['id'] for p in s['visible']]
        assert len(visited)==251
        page.keyboard.press('Tab');wait(page);page.emulate_media(reduced_motion='no-preference')
    check('Density, deferred edits, stable additions/removals and all 250 links reachable',density_and_data)
    def occlusion():
        load();q=next(q for q in state(page)['visible'] if q['id']!='self')
        page.mouse.move(q['x'],q['y']);wait(page)
        # Beside the narrower description, inside the old hiding rectangle.
        # Stay outside the SVG title's native selectable character cells.
        target={'x':state(page)['titleBounds']['left']+9,'y':state(page)['centerBounds']['bottom']-4}
        page.mouse.down();page.mouse.move(target['x'],target['y'],steps=10);page.mouse.up();wait(page,600)
        dot=page.locator(f'.content-dot[data-id="{q["id"]}"]')
        assert dot.get_attribute('visibility')=='visible'
        assert q['id'] in [x['id'] for x in state(page)['visible']]
        assert page.locator(f'.destination[data-id="{q["id"]}"]').get_attribute('data-occluded')=='false'
        page.screenshot(path=str(OUT/'node-in-type-gap.png'))
        page.mouse.click(target['x'],target['y']);inspected(page)
        load();q=next(q for q in state(page)['visible'] if q['id']!='self')
        page.mouse.move(q['x'],q['y']);wait(page)
        glyph=page.locator('#center-title tspan').first.evaluate('(e)=>{const r=e.getExtentOfChar(0);return {x:r.x+r.width/2,y:r.y+r.height/2}}')
        page.mouse.down();page.mouse.move(glyph['x'],glyph['y'],steps=10);page.mouse.up();wait(page,600)
        assert page.locator(f'.content-dot[data-id="{q["id"]}"]').get_attribute('visibility')=='visible'
        assert page.evaluate('(p)=>!!document.elementFromPoint(p.x,p.y)?.closest("#editorial")',glyph)
        page.mouse.click(glyph['x'],glyph['y']);assert page.url.endswith('?demo')
        page.locator(f'.destination[data-id="{q["id"]}"]').focus();wait(page,700)
        assert q['id'] in [x['id'] for x in state(page)['visible']]
    check('Nodes remain visible and clickable in text gaps; typography overlays glyphs; keyboard recovers focus',occlusion)
    def accessibility():
        load();page.emulate_media(reduced_motion='reduce');page.keyboard.press('Tab')
        assert page.locator('#center-content').evaluate('(e)=>getComputedStyle(e).opacity')=='1'
        assert state(page)['active']==state(page)['focused']
        assert page.locator('.content-dot:not([data-id="self"])').first.evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
        selected=state(page)['active'];page.keyboard.press('Escape');assert state(page)['active']==selected
        page.emulate_media(forced_colors='active');assert page.locator('.atmosphere').evaluate('(e)=>getComputedStyle(e).display')=='none'
        assert page.locator('#structure').evaluate('(e)=>getComputedStyle(e).display')=='none'
        assert page.locator('#center-title').evaluate('(e)=>getComputedStyle(e).fill')=='rgb(0, 0, 0)'
        page.keyboard.press(']');page.screenshot(path=str(OUT/'high-contrast.png'))
        page.evaluate('window.portfolio.failRenderer()');assert page.locator('#network').evaluate('(e)=>getComputedStyle(e).display')=='none'
        assert page.locator('.destination[tabindex="0"]').count()==23
        assert page.locator('.destination').first.inner_text()
        page.screenshot(path=str(OUT/'renderer-fallback.png'))
        page.emulate_media(reduced_motion='no-preference',forced_colors='none')
    check('Reduced motion, forced colors and real-link renderer fallback',accessibility)
    def responsive():
        for w,h in [(768,1024),(390,844),(320,568),(1024,480)]:
            page.set_viewport_size({'width':w,'height':h});load();s=state(page)
            assert s['titleBounds']['left']>=20 and s['titleBounds']['right']<=w-20
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        page.set_viewport_size({'width':390,'height':844});load()
        q=next(q for q in state(page)['visible'] if q['id']!='self')
        long=[{'id':'long','title':'A longer project title about connected mathematical structures','description':'A descriptive sentence that stays readable when the browser text is enlarged.','href':'/demo/destination.html','relations':[]}]
        page.evaluate('d=>window.portfolio.setContent(d)',long);page.keyboard.press('Tab');wait(page,700)
        assert page.locator('#center-title tspan').count()>=2
        assert float(page.locator('#center-title').evaluate('(e)=>getComputedStyle(e).fontSize').replace('px',''))>=26
        assert state(page)['titleBounds']['left']>=24
        page.evaluate("document.documentElement.style.fontSize='32px'");wait(page,600)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert page.locator('#support').evaluate('(e)=>parseFloat(getComputedStyle(e).lineHeight)>parseFloat(getComputedStyle(e).fontSize)')
        assert page.locator('#center-description').evaluate('(e)=>e.children.length<2||Number(e.children[1].getAttribute("y"))-Number(e.children[0].getAttribute("y"))>parseFloat(getComputedStyle(e).fontSize)')
        page.screenshot(path=str(OUT/'enlarged-text.png'),full_page=True)
        camera=state(page)['camera'];page.mouse.move(5,50);page.mouse.wheel(0,200);wait(page,200)
        assert page.evaluate('scrollY')>0 and state(page)['camera']==camera
        page.evaluate("document.documentElement.style.fontSize='16px'")
        page.set_viewport_size({'width':1440,'height':900});load('')
        assert page.locator('.destination').count()==4 and page.locator('#support').text_content()==''
        assert page.locator('#group-key').is_visible()
        page.screenshot(path=str(OUT/'real-projects.png'))
    check('Responsive sizes, long titles, enlarged text and real project content',responsive)
    mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    mobile.on('pageerror',lambda e:errors.append(str(e)))
    mobile.goto(URL+'?demo');mobile.wait_for_load_state('networkidle')
    def touch():
        q=next(q for q in state(mobile)['visible'] if q['id']!='self')
        assert mobile.locator('.destination').first.evaluate('(e)=>getComputedStyle(e).width')=='44px'
        mobile.touchscreen.tap(q['x'],q['y']);wait(mobile)
        assert state(mobile)['owner']=='touch' and state(mobile)['active']==q['id']
        assert mobile.locator('#support').text_content()=='Tap again to open.'
        mobile.screenshot(path=str(OUT/'touch-preview.png'))
        other=next(x for x in state(mobile)['visible'] if x['id']!=q['id'])
        mobile.touchscreen.tap(other['x'],other['y']);wait(mobile)
        assert state(mobile)['active']==other['id'] and state(mobile)['owner']=='touch'
        mobile.touchscreen.tap(5,800);wait(mobile);assert state(mobile)['active'] is not None
        mobile.touchscreen.tap(q['x'],q['y']);wait(mobile);mobile.touchscreen.tap(q['x'],q['y']);inspected(mobile)
        return_to_graph(mobile);wait(mobile)
        cdp=mobile.context.new_cdp_session(mobile)
        def dispatch(kind,points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':i}for i,(x,y)in enumerate(points)]})
        before=state(mobile)['camera']
        dispatch('touchStart',[(50,80)]);dispatch('touchMove',[(55,80)]);assert state(mobile)['camera']==before
        dispatch('touchMove',[(90,110)]);dispatch('touchEnd',[]);wait(mobile)
        near(state(mobile)['camera']['x']-before['x'],40);near(state(mobile)['camera']['y']-before['y'],30)
        before=state(mobile)['camera'];anchor={'x':150,'y':150};world={'x':(150-195-before['x'])/before['scale'],'y':(150-422-before['y'])/before['scale']}
        dispatch('touchStart',[(100,150),(200,150)]);dispatch('touchMove',[(80,150),(220,150)]);dispatch('touchEnd',[]);wait(mobile)
        after=state(mobile)['camera'];near(after['scale']/before['scale'],1.4,.02)
        near(195+after['x']+world['x']*after['scale'],150,1);near(422+after['y']+world['y']*after['scale'],150,1)
        assert state(mobile)['active'] is not None
    check('Touch targets, pin/switch/persist/open, direct drag and anchored pinch',touch)
    def font_failure():
        fallback=browser.new_page(viewport={'width':390,'height':844})
        fallback.route('**/*.woff*',lambda route:route.abort())
        fallback.goto(URL+'?demo');fallback.wait_for_load_state('networkidle');wait(fallback)
        assert fallback.locator('.destination').count()==23
        bounds=state(fallback)['titleBounds'];assert bounds['left']>=24 and bounds['right']<=366
        fallback.keyboard.press('Tab');wait(fallback);assert state(fallback)['active']
        fallback.screenshot(path=str(OUT/'font-fallback.png'));fallback.close()
    check('Font-load failure retains fitting text and navigable content',font_failure)
    assert not errors,errors
    (OUT/'verification.json').write_text(json.dumps({'passed':results,'browser':'Chromium / installed Chrome','page_errors':errors},indent=2))
    browser.close()
print(f'{len(results)} acceptance groups passed.')
