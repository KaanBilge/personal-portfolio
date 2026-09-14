"""Real project content, category semantics and detail refinement acceptance."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright

OUT = Path('test-results/projects')
OUT.mkdir(parents=True, exist_ok=True)
report = []

def state(page): return page.evaluate('window.portfolio.inspect()')
def scene(page, value):
    page.wait_for_function('(s)=>document.querySelector("#scenes").dataset.scene===s', arg=value)
def open_project(page, project):
    page.locator(f'.destination[data-id="{project}"]').focus()
    page.wait_for_timeout(800)
    before = state(page)
    page.keyboard.press('Enter'); scene(page, 'detail')
    return before
def close_project(page):
    page.keyboard.press('Escape'); scene(page, 'graph')
def passed(name): report.append(name); print('PASS', name, flush=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=os.getenv('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe'))
    page = browser.new_page(viewport={'width':1440, 'height':900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:5173/'); page.wait_for_load_state('networkidle')
    assert page.locator('.destination').count() == 4
    assert page.locator('#group-key span').all_text_contents() == ['Software', 'Math', 'Hobby']
    assert page.locator('.destination[data-id="self"]').get_attribute('aria-description').startswith('Hobby.')
    colors = page.locator('.content-dot').evaluate_all('es=>Object.fromEntries(es.map(e=>[e.dataset.id,getComputedStyle(e).fill]))')
    assert colors == {'self':'rgb(161, 138, 195)', 'progressive':'rgb(201, 139, 97)', 'thesis':'rgb(201, 139, 97)', 'wizard-battle':'rgb(201, 139, 97)'}, colors
    page.screenshot(path=str(OUT/'hero.png'))
    passed('Real project nodes and readable category key; software orange, personal page purple')

    for project in ['progressive', 'thesis', 'wizard-battle']:
        before = open_project(page, project)
        assert page.url == 'http://127.0.0.1:5173/' and len(page.context.pages) == 1
        assert page.locator('.detail-page').get_attribute('data-group') == 'software'
        assert page.locator('.group-type').text_content().startswith('Software / ')
        page.wait_for_function('[...document.querySelectorAll(".project-visual")].every(e=>e.complete&&e.naturalWidth>0)')
        assert page.locator('.project-visual').count() == (2 if project == 'progressive' else 1)
        frame = page.locator('.detail-media').bounding_box()
        assert frame['width'] > 850 and frame['height'] >= 480
        assert page.locator('.detail-metadata').bounding_box()['y'] > frame['y'] + 30
        assert page.locator('.detail-media').evaluate('e=>getComputedStyle(e,"::after").borderTopWidth') == '1px'
        assert page.locator('figcaption,.figure-number').count() == 0
        assert page.locator('#project-detail').evaluate('e=>e.scrollHeight<=e.clientHeight+1')
        assert 'radial-gradient' in page.locator('#inspect-field').evaluate('e=>getComputedStyle(e).maskImage')
        assert page.locator('#inspect-field').evaluate('e=>getComputedStyle(e).maskComposite').startswith('intersect')
        if project != 'thesis':
            link = page.get_by_role('link', name='GitHub')
            assert link.get_attribute('href') == 'https://github.com/KaanBilge/' + project
            link.hover(); page.wait_for_timeout(250)
            assert link.locator('.link-label').evaluate('e=>getComputedStyle(e,"::after").transform') == 'matrix(1, 0, 0, 1, 0, 0)'
        else:
            assert page.locator('.detail-links').count() == 0  # No unverified destination.
        loop = page.get_by_role('button', name='Unwind the loop')
        loop.click(); assert loop.get_attribute('aria-pressed') == 'true'
        page.keyboard.press('Space'); assert loop.get_attribute('aria-pressed') == 'false'
        page.mouse.click(35, 30)  # Remove keyboard focus decoration for the composition proof.
        page.screenshot(path=str(OUT/f'{project}-desktop.png'))
        close_project(page)
        after = state(page)
        for key in ['active', 'camera', 'positions', 'offsets']: assert after[key] == before[key], key
        assert page.locator('.destination[aria-current="true"]').get_attribute('data-id') == project
    passed('Actual media, offset metadata, thin media edge, local mesh softness, link underline, reversible loop and preserved graph state')

    for width, height in [(390,844), (320,568), (1024,480)]:
        page.set_viewport_size({'width':width, 'height':height})
        for project in ['progressive', 'thesis', 'wizard-battle']:
            open_project(page, project)
            assert page.locator('#project-detail').evaluate('e=>e.scrollWidth<=e.clientWidth')
            if width < 768:
                assert page.locator('.detail-aside').bounding_box()['y'] >= page.locator('.detail-media').bounding_box()['y'] + page.locator('.detail-media').bounding_box()['height']
                if project == 'progressive':
                    assert not page.locator('.companion-visual').is_visible()
                    assert page.locator('.project-visual').first.bounding_box()['width'] > width * .4
            page.mouse.click(5, 5)
            page.screenshot(path=str(OUT/f'{project}-{width}.png'))
            page.locator('#project-detail').evaluate('e=>e.scrollTop=e.scrollHeight')
            page.wait_for_timeout(50)
            page.locator('#inspect-handle').click(); scene(page, 'graph')
    passed('Mobile stacks media and metadata; portrait media stays legible; short screens scroll and return')

    page.set_viewport_size({'width':1440, 'height':900})
    page.emulate_media(reduced_motion='reduce')
    page.goto('http://127.0.0.1:5173/'); page.wait_for_load_state('networkidle')
    page.evaluate('window.portfolio.setContent([{id:"math-proof",title:"Math example",description:"A category verification fixture.",group:"math",category:"Research"}])')
    before = open_project(page, 'math-proof')
    assert page.locator('.group-type').evaluate('e=>getComputedStyle(e).color') == 'rgb(120, 157, 203)'
    assert page.locator('.loop-thread').evaluate('e=>getComputedStyle(e).transitionDuration') == '0s'
    assert not state(page)['physicsRunning']
    close_project(page)
    assert page.locator('.content-dot[data-id="math-proof"]').evaluate('e=>getComputedStyle(e).fill') == 'rgb(120, 157, 203)'
    assert state(page)['active'] == before['active']
    passed('New math data uses blue throughout without a new component; reduced motion retains navigation')
    assert not errors, errors
    (OUT/'report.json').write_text(json.dumps({'passed':report, 'pageErrors':errors}, indent=2))
    browser.close()
