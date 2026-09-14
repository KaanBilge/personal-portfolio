"""Inspect-scene acceptance, using the existing local Vite server and Chrome.
Run: python tests/inspect_checks.py. Screenshots/report: test-results/inspect/.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright

OUT = Path('test-results/inspect')
OUT.mkdir(parents=True, exist_ok=True)
URL = 'http://127.0.0.1:5173/'
report = []

def state(page): return page.evaluate('window.portfolio.inspect()')
def wait(page, ms=950): page.wait_for_timeout(ms)
def scene(page, value):
    page.wait_for_function('(value)=>document.querySelector("#scenes").dataset.scene===value', arg=value)
def selected(page):
    q = next(q for q in state(page)['visible'] if q['id'] != 'self')
    page.mouse.move(q['x'], q['y']); wait(page)
    assert state(page)['active'] == q['id']
    return q
def passed(text): report.append(text); print('PASS', text, flush=True)
def load(page, query='?demo'):
    page.goto(URL + query); page.wait_for_load_state('networkidle')
def back(page):
    page.locator('#inspect-handle').click(); scene(page, 'graph'); wait(page, 100)
def graph_equal(before, after):
    for key in ['active', 'camera', 'positions', 'offsets']:
        assert before[key] == after[key], key

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.getenv('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe'), headless=True)
    page = browser.new_page(viewport={'width':1440, 'height':900})
    errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    load(page); q=selected(page); before=state(page)
    page.evaluate('window.originalTitle=document.querySelector("#center-title")')
    title_before=page.locator('#center-title').bounding_box()
    page.screenshot(path=str(OUT/'hero-selected.png'))
    page.mouse.click(q['x'], q['y']); wait(page, 370)
    middle=page.evaluate('''() => ({
      hero:document.querySelector('#portfolio').getBoundingClientRect().top,
      detail:document.querySelector('#project-detail').getBoundingClientRect().top,
      angle:getComputedStyle(document.querySelector('#inspect-handle svg')).transform,
      parent:document.querySelector('#center-title').parentElement.id
    })''')
    assert -900 < middle['hero'] < 0 and 0 < middle['detail'] < 900, middle
    assert abs(middle['detail']-middle['hero']-900)<1
    assert middle['parent']=='travel-title'
    title_middle=page.locator('#center-title').bounding_box()
    assert 100<title_middle['x']<title_before['x'] and 70<title_middle['y']<title_before['y']
    page.screenshot(path=str(OUT/'transition.png'))
    scene(page,'detail')
    assert page.url==URL+'?demo' and len(page.context.pages)==1
    assert page.evaluate('window.originalTitle===document.querySelector("#center-title")')
    assert page.locator('.detail-title-host #center-title').count()==1
    assert page.locator('#project-heading').evaluate('e=>e===document.activeElement')
    assert page.locator('#inspect-handle').get_attribute('aria-expanded')=='true'
    assert page.locator('#inspect-handle svg').evaluate('e=>getComputedStyle(e).transform')=='matrix(-1, 0, 0, -1, 0, 0)'
    assert page.locator('#portfolio').evaluate('e=>e.inert')
    assert not state(page)['physicsRunning']
    graph_equal(before,state(page))
    assert page.locator('.project-visual').evaluate('e=>e.complete && e.naturalWidth>0')
    assert page.locator('.detail-media').bounding_box()['width']>750
    assert page.locator('.detail-links a').count()==2
    assert page.locator('figcaption,.figure-number').count()==0
    assert page.locator('.detail-metadata dd').first.evaluate('e=>getComputedStyle(e).fontSize')=='18px'
    # Every structural edge crossing the scene boundary continues with the same
    # projected endpoints, rather than a separately generated decorative mesh.
    continuity=page.evaluate('''() => {
      const height=document.querySelector('#portfolio').clientHeight;
      const segments=document.querySelector('#structure path').getAttribute('d').match(/M[^M]+/g);
      const crossing=segments.filter(segment=>{
        const [x,y,x2,y2]=segment.slice(1).split(/[L,]/).map(Number);
        return (y<height && y2>height)||(y2<height && y>height);
      });
      const continuation=document.querySelector('#inspect-field-edges').getAttribute('d');
      return {count:crossing.length, matched:crossing.every(segment=>continuation.includes(segment)),
        background:getComputedStyle(document.querySelector('#project-detail')).backgroundColor};
    }''')
    assert continuity['count']>0 and continuity['matched'],continuity
    assert continuity['background']=='rgba(0, 0, 0, 0)'
    assert page.locator('#project-detail').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
    page.screenshot(path=str(OUT/'desktop.png'))
    passed('Selected node opens internally; connected scenes translate; same title moves; handle turns; media, links and focus are present')

    with page.expect_popup() as popup: page.get_by_role('link',name='Visit project').click()
    popup.value.wait_for_load_state(); assert '/demo/destination.html' in popup.value.url; popup.value.close()
    assert page.locator('#scenes').get_attribute('data-scene')=='detail'
    back(page); graph_equal(before,state(page))
    assert page.locator('#center-content #center-title').count()==1
    assert page.locator(f'.destination[data-id="{q["id"]}"]').evaluate('e=>e===document.activeElement')
    assert page.locator('.content-dot').evaluate_all('es=>es.filter(e=>getComputedStyle(e).fill==="rgb(201, 139, 97)").map(e=>e.dataset.id)')==[q['id']]
    passed('External navigation occurs inside detail; reverse transition restores exact camera, geometry, orange selection and node focus')

    page.locator('#inspect-handle').click(); scene(page,'detail')
    assert page.locator('#project-detail').get_attribute('data-project')==q['id']
    page.keyboard.press('Escape'); scene(page,'graph')
    assert page.locator('#inspect-handle').evaluate('e=>e===document.activeElement')
    # Reversing midway uses the same title object and scene track, without races.
    page.locator('#inspect-handle').click(); wait(page,250)
    page.locator('#inspect-handle').click(); wait(page,100)
    page.locator('#inspect-handle').click(); scene(page,'detail'); back(page)
    graph_equal(before,state(page))
    passed('Manual handle shares the node path; Escape and interrupted/reversed transitions preserve state')

    load(page)
    page.keyboard.press('Tab'); wait(page,500)
    page.keyboard.press(']'); wait(page,500)
    keyboard_id=state(page)['active']
    page.keyboard.press('Enter'); scene(page,'detail')
    page.keyboard.press('Tab')
    assert page.locator('.detail-links a').first.evaluate('e=>e===document.activeElement')
    page.keyboard.press('Escape'); scene(page,'graph')
    assert page.locator(f'.destination[data-id="{keyboard_id}"]').evaluate('e=>e===document.activeElement')
    page.keyboard.press('Space'); scene(page,'detail'); back(page)
    passed('Keyboard node Enter/Space, heading focus, links, Escape and restored graph focus work')

    page.emulate_media(reduced_motion='reduce'); load(page); q=selected(page)
    before=state(page); page.mouse.click(q['x'],q['y']); wait(page,50)
    assert page.locator('#scenes').get_attribute('data-scene')=='detail'
    assert page.locator('#travel-title').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
    back(page); graph_equal(before,state(page))
    page.emulate_media(reduced_motion='no-preference')
    passed('Reduced motion changes scene immediately with the same navigation and no title flight')

    load(page); q=selected(page)
    page.mouse.move(35,40); page.mouse.down(); page.mouse.move(150,80,steps=8); page.mouse.up(); wait(page)
    before=state(page); page.locator('#inspect-handle').click(); scene(page,'detail'); back(page)
    graph_equal(before,state(page))
    passed('Panned graph camera and physical offsets survive inspection unchanged')

    for width,height in [(1440,900),(768,1024),(390,844),(320,568),(1024,480)]:
        page.set_viewport_size({'width':width,'height':height}); load(page); selected(page)
        page.locator('#inspect-handle').click(); scene(page,'detail')
        assert page.locator('#project-detail').evaluate('e=>e.scrollWidth<=e.clientWidth')
        title=page.locator('#center-title').bounding_box(); assert title['x']>=20 and title['x']+title['width']<=width-20
        if width<768:
            assert page.locator('.detail-aside').bounding_box()['y']>page.locator('.detail-media').bounding_box()['y']
        page.screenshot(path=str(OUT/f'detail-{width}.png'))
        page.locator('#project-detail').evaluate('e=>e.scrollTop=e.scrollHeight')
        back(page)
    passed('Desktop, tablet, mobile and short viewports remain readable; detail scroll and persistent return work')

    page.set_viewport_size({'width':1440,'height':900}); load(page)
    page.locator('#inspect-handle').click(); scene(page,'detail')
    page.set_viewport_size({'width':390,'height':844}); wait(page,400)
    assert page.locator('#scenes').get_attribute('data-scene')=='detail'
    assert page.locator('#center-title').bounding_box()['width']<=342
    back(page)
    passed('Resizing while inspected recomputes the same title and returns safely')

    minimal={'id':'minimal','title':'A longer project title about connected mathematical structures','description':'A concise introduction with no required external destination.'}
    load(page); page.evaluate('d=>window.portfolio.setContent([d])',minimal)
    page.locator('.destination[data-id="minimal"]').focus(); wait(page,600)
    page.keyboard.press('Enter'); scene(page,'detail')
    assert page.locator('.detail-links a').count()==0
    assert page.locator('.detail-metadata').count()==0
    assert page.locator('.media-unavailable').is_visible()
    assert page.locator('.detail-easter-egg').count()==1
    assert page.locator('#center-title').bounding_box()['width']<=342
    page.screenshot(path=str(OUT/'minimal-long-title.png'))
    page.evaluate('window.portfolio.setContent([])')
    assert state(page)['active']=='minimal' and state(page)['pending']
    back(page); wait(page,500); assert state(page)['active']=='self'
    passed('Optional data and missing media degrade honestly; long titles fit; live deletion defers safely until return')

    page.set_viewport_size({'width':1440,'height':900}); load(page,'?demo&fallback')
    page.locator('.destination[data-id="demo-001"]').click(); scene(page,'detail')
    assert page.locator('#project-detail').get_attribute('data-project')=='demo-001'
    back(page)
    passed('Textual graph fallback also opens the reusable internal detail')

    mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    mobile.on('pageerror',lambda e:errors.append(str(e)))
    load(mobile); q=next(q for q in state(mobile)['visible'] if q['id']!='self')
    mobile.touchscreen.tap(q['x'],q['y']); wait(mobile)
    assert state(mobile)['active']==q['id'] and mobile.locator('#scenes').get_attribute('data-scene') is None
    mobile.touchscreen.tap(q['x'],q['y']); scene(mobile,'detail')
    mobile.locator('#inspect-handle').tap(); scene(mobile,'graph')
    assert state(mobile)['active']==q['id']
    passed('Touch first selects, second tap inspects; touch return retains selection')
    assert not errors, errors
    (OUT/'report.json').write_text(json.dumps({'passed':report,'pageErrors':errors},indent=2))
    browser.close()

