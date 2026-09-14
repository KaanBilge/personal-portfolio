from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os

OUT = Path('test-results')
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.getenv('CHROME_PATH',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),headless=True)
    page=browser.new_page(viewport={"width":1440,"height":900},device_scale_factor=1)
    page.on('pageerror',lambda error: print('PAGE ERROR',error))
    page.goto('http://127.0.0.1:5173/?demo')
    page.wait_for_load_state('networkidle')
    print('DOM',page.locator('#center-title').text_content(),page.locator('.destination').count())
    print('STATE',json.dumps(page.evaluate('({bounds:window.portfolio.inspect().titleBounds,vertices:window.portfolio.inspect().visibleStructuralVertices})')))
    page.screenshot(path=str(OUT/'desktop.png'))
    point=page.evaluate("window.portfolio.inspect().visible.find(p=>p.id==='demo-001') || window.portfolio.inspect().visible[0]")
    page.mouse.move(point['x'],point['y'])
    page.wait_for_timeout(450)
    page.screenshot(path=str(OUT/'hover.png'))
    print('HOVER',page.locator('#center-title').text_content(),json.dumps(page.evaluate('window.portfolio.inspect().titleBounds')))
    for w,h in [(768,1024),(390,844),(320,568),(1024,480)]:
        mobile=browser.new_page(viewport={"width":w,"height":h},device_scale_factor=1,is_mobile=w<600,has_touch=w<600)
        mobile.goto('http://127.0.0.1:5173/?demo')
        mobile.wait_for_load_state('networkidle')
        mobile.screenshot(path=str(OUT/f'{w}x{h}.png'))
        print('SIZE',w,h,json.dumps(mobile.evaluate('({bounds:window.portfolio.inspect().titleBounds,vertices:window.portfolio.inspect().visibleStructuralVertices})')))
        mobile.close()
    browser.close()
