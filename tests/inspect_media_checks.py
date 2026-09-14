"""Media formats, reduced motion, failure and enlarged-text inspect checks."""
from io import BytesIO
from pathlib import Path
import os
from PIL import Image
from playwright.sync_api import sync_playwright

URL='http://127.0.0.1:5173/'
def inspected(page): page.wait_for_function('document.querySelector("#scenes").dataset.scene === "detail"')
def returned(page):
    page.locator('#inspect-handle').click()
    page.wait_for_function('document.querySelector("#scenes").dataset.scene === "graph"')
def open_item(page, item):
    # Content edits intentionally wait while keyboard exploration owns the graph.
    page.locator('#inspect-handle').focus()
    page.evaluate('item=>window.portfolio.setContent([item])',item)
    page.locator('.destination[data-id="media"]').focus()
    page.wait_for_timeout(700);page.keyboard.press('Enter');inspected(page)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.getenv('CHROME_PATH',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),headless=True)
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL);page.wait_for_load_state('networkidle')
    # Generate small, unmistakably synthetic playback fixtures in memory.
    gif=BytesIO()
    Image.new('RGB',(16,16),'#8994a5').save(gif,format='GIF',save_all=True,append_images=[Image.new('RGB',(16,16),'#c98b61')],duration=200,loop=0)
    page.route('**/__test__/animated.gif',lambda route:route.fulfill(content_type='image/gif',body=gif.getvalue()))
    clip=page.evaluate('''async () => {
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=100;
      const context=canvas.getContext('2d');const stream=canvas.captureStream(10);
      const recorder=new MediaRecorder(stream,{mimeType:'video/webm'});const chunks=[];
      recorder.ondataavailable=e=>chunks.push(e.data);
      const done=new Promise(resolve=>recorder.onstop=async()=>resolve([...new Uint8Array(await new Blob(chunks).arrayBuffer())]));
      recorder.start();for(let i=0;i<8;i++){context.fillStyle=i%2?'#8994a5':'#c98b61';context.fillRect(0,0,160,100);await new Promise(r=>setTimeout(r,100));}
      recorder.stop();stream.getTracks().forEach(t=>t.stop());return done;
    }''')
    page.route('**/__test__/clip.webm',lambda route:route.fulfill(content_type='video/webm',body=bytes(clip)))
    page.route('**/__test__/missing.png',lambda route:route.fulfill(status=404,body='missing'))
    base={'id':'media','title':'Media study','description':'A local playback fixture.'}
    video={**base,'mediaType':'video','media':{'src':'/__test__/clip.webm','poster':'/media/portfolio-study.png','alt':'Synthetic video for playback verification.'}}
    open_item(page,video)
    page.wait_for_function('document.querySelector("video").currentTime > 0')
    assert page.locator('video').evaluate('e=>e.muted && e.loop && e.playsInline && e.controls && !e.paused')
    returned(page);assert page.locator('video').evaluate('e=>e.paused')
    page.emulate_media(reduced_motion='reduce');open_item(page,video)
    assert page.locator('video').evaluate('e=>e.paused && e.currentTime === 0')
    returned(page)
    print('PASS Silent looping video, native controls, pause on return and reduced-motion playback',flush=True)

    animated={**base,'mediaType':'animated','media':{'src':'/__test__/animated.gif','poster':'/media/portfolio-study.png','alt':'Synthetic animated image for playback verification.'}}
    open_item(page,animated)
    assert page.locator('.media-motion-toggle').text_content()=='Play animation'
    assert page.locator('img[src="/__test__/animated.gif"]').count()==0
    page.get_by_role('button',name='Play animation').click()
    assert page.locator('img[src="/__test__/animated.gif"]').is_visible()
    page.get_by_role('button',name='Pause animation').click()
    assert page.locator('img[src="/__test__/animated.gif"]').count()==0
    returned(page);page.emulate_media(reduced_motion='no-preference');open_item(page,animated)
    assert page.locator('.media-motion-toggle').text_content()=='Pause animation'
    returned(page)
    print('PASS Animated image support, static reduced-motion poster and explicit play/pause',flush=True)

    open_item(page,{**base,'media':{'src':'/__test__/missing.png'},'easterEgg':False})
    assert page.locator('.media-unavailable').text_content()=='Project media to follow.'
    assert page.locator('.detail-easter-egg').count()==0
    page.set_viewport_size({'width':320,'height':568})
    page.evaluate('document.documentElement.style.fontSize="32px"')
    page.wait_for_timeout(400)
    assert page.locator('#project-detail').evaluate('e=>e.scrollWidth<=e.clientWidth')
    assert page.locator('.detail-description').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')==30
    page.emulate_media(forced_colors='active')
    assert page.locator('#center-title').evaluate('e=>getComputedStyle(e).fill')=='rgb(0, 0, 0)'
    returned(page)
    print('PASS Failed media, optional egg, enlarged text and forced colors remain usable',flush=True)

    # A deliberately failed renderer constructor must not reintroduce direct
    # external graph links through the last-resort catch branch.
    broken=browser.new_page(viewport={'width':1440,'height':900})
    def fail_graph(route):
        response=route.fetch()
        source=response.text().replace('this.onInspect = onInspect;', 'throw new Error("Test constructor failure");')
        route.fulfill(response=response,body=source)
    broken.route('**/src/graph.js*',fail_graph)
    broken.goto(URL+'?demo');broken.wait_for_load_state('networkidle')
    assert broken.locator('#portfolio.fallback').count()==1
    broken.get_by_role('button',name='PROJECT NAME',exact=True).click();inspected(broken)
    assert broken.get_by_role('heading',name='PROJECT NAME').is_visible()
    assert broken.locator('.detail-links a').count()==2
    assert broken.locator('#destinations a').count()==0
    returned(broken)
    print('PASS Constructor failure uses the same internal detail component',flush=True)
    assert not errors, errors
    browser.close()
