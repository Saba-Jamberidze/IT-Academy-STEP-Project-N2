// shared navigation script — ყველა გვერდზე ჩატვირთული:
// burgerOn/burgerOf — მენიუ გახსნა/დახურვა; closeNav — ლინკზე დაკლიკვაზე დახურვა;
// overlay — fetch-ის დროს loading ანიმაცია; window.fetch override — ყოველ ქსელურ მოთხოვნაზე ჩართვა.
document.addEventListener('DOMContentLoaded', () => {
    const burgerOn = document.getElementById('burgerIco')
    const burgerOf = document.getElementById('burgerIcoX')
    const burgerNav = document.getElementById('burgerNav')
    const closeNav = document.getElementById('closeNav')

    if (burgerOn && burgerNav) {
        burgerOn.addEventListener("click", () => {
            burgerNav.style.display = "flex"
        })
    }
    if (burgerOf && burgerNav) {
        burgerOf.addEventListener("click", () => {
            burgerNav.style.display = "none"
        })
    }
    if (closeNav && burgerNav) {
        closeNav.addEventListener("click", () => {
            burgerNav.style.display = "none"
        })
    }

    // ყველა ქსელურ მოთხოვნაზე ერთიანი loader overlay.
    const overlay = document.createElement('div')
    overlay.id = 'global-loading-overlay'
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.backgroundColor = '#ffffff'

    overlay.style.display = 'none'
    
    overlay.style.alignItems = 'center'
    overlay.style.justifyContent = 'center'
    overlay.style.zIndex = '9999'
    overlay.style.opacity = '0'
    overlay.style.transition = 'opacity 0.3s ease'

    const img = document.createElement('img')
    img.src = 'https://cdn.dribbble.com/userupload/22076800/file/original-8e7ce77dec0edaf0105e8287038f6e60.gif'
    img.alt = 'Loading...'
    img.style.maxWidth = '200px'
    img.style.width = '40vw'
    img.style.height = 'auto'

    overlay.appendChild(img)
    document.body.appendChild(overlay)

    let activeFetches = 0
    const originalFetch = window.fetch.bind(window)

    // loader-ის ჩართვა fade-in ეფექტით.
    function fadeInOverlay() {
        if (overlay.style.display !== 'flex') {
            overlay.style.display = 'flex'
            // force reflow before changing opacity
            // eslint-disable-next-line no-unused-expressions
            overlay.offsetHeight
        }
        overlay.style.opacity = '1'
    }

    // loader-ის გათიშვა fade-out ეფექტით.
    function fadeOutOverlay() {
        overlay.style.opacity = '0'
        setTimeout(() => {
            if (activeFetches === 0) {
                overlay.style.display = 'none'
            }
        }, 300)
    }

    window.fetch = async (...args) => {
        activeFetches++
        if (activeFetches === 1) {
            fadeInOverlay()
        }
        try {
            const response = await originalFetch(...args)
            return response
        } catch (err) {
            throw err
        } finally {
            activeFetches--
            if (activeFetches <= 0) {
                activeFetches = 0
                fadeOutOverlay()
            }
        }
    }
})