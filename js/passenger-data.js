// passenger-data page script:
// აწყობს მგზავრების ფორმას, ადგილების არჩევას, API-დან ადგილების სტატუსს და checkout payload-ს.
const trainNumber = document.getElementById('trainNumber')
const trainName = document.getElementById('trainName')
const trainDeparture = document.getElementById('trainDeparture')
const from = document.getElementById('from')
const trainArrive = document.getElementById('trainArrive')
const to = document.getElementById('to')

function title() {
    trainNumber.textContent = ("#" + localStorage.getItem("train_number"))
    trainName.textContent = localStorage.getItem("train_name")
    trainDeparture.textContent = localStorage.getItem("train_departure")
    from.textContent = localStorage.getItem("from")
    trainArrive.textContent = localStorage.getItem("train_arrive")
    to.textContent = localStorage.getItem("to")
}
title()

// 1) გვერდის ზედა ნაწილში ვაჩვენებთ მატარებლის დეტალებს localStorage-დან.
//    ამისთვის `title()` ფუნქცია უკვე ზემოთვე გამოიძახა და ანიჭებს ტექსტს DOM ელემენტებს.

const email = document.getElementById('email')
const phoneNumber = document.getElementById('phoneNumber')
const form = document.getElementById('form')

phoneNumber.addEventListener("keydown", (e) => {
    const value = phoneNumber.value;

    // ვუშვებთ სპეციალურ ღილაკებს (backspace, arrows და ა.შ.)
    if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Tab"
    ) return;

    // თუ უკვე 10 არის ან მეტი — დაბლოკე
    if (value.length >= 9) {
        e.preventDefault();
    }
});

// 2) "ჩვენი" (არჩეული) ადგილები ცალკე array-ში აღარ ინახება.
//    მწვანე/წითელი და საბოლოო payload გამოდის პირდაპირ input-ებიდან:
//    `seat${idx}` (ადგილის code) და `vagon${idx}` (ვაგონის კლასი).

// 3) API-დან ჩატვირთული დაკავებული ადგილები (ვაგონის სახელით):
//    `apiOccupiedSeats[ვაგონი] => [seatCode,...]`
let apiOccupiedSeats = {
    'I კლასი': [],
    'II კლასი': [],
    'ბიზნესი': []
}

// 4) API-დან ჩატვირთული ფასები:
//    `apiSeatPrices[ვაგონი][seatCode] => price`
let apiSeatPrices = {
    'I კლასი': {},
    'II კლასი': {},
    'ბიზნესი': {}
}

// 5) API-დან ჩატვირთული seatId-ები (checkout/POST-ისთვის):
//    `apiSeatIds[ვაგონი][seatCode] => seatId`
let apiSeatIds = {
    'I კლასი': {},
    'II კლასი': {},
    'ბიზნესი': {}
}

console.log(apiOccupiedSeats);
console.log(apiSeatPrices);
console.log(apiSeatIds);

function renameCity(fromORto) {
    if (fromORto === "თბილისი") return "%E1%83%97%E1%83%91%E1%83%98%E1%83%9A%E1%83%98%E1%83%A1%E1%83%98"
    if (fromORto === "ბათუმი") return "%E1%83%91%E1%83%90%E1%83%97%E1%83%A3%E1%83%9B%E1%83%98"
    if (fromORto === "ფოთი") return "%E1%83%A4%E1%83%9D%E1%83%97%E1%83%98"
    return fromORto || ""
}

let apiOccupiedSeatsLoaded = false

// 6) API-ის დატვირთვა:
//    `ensureApiDataLoaded()` პირველად ითვლის დაკავებულ ადგილებს API-დან და ინახავს cache-ში.
//    შემდეგ `apiOccupiedSeatsLoaded = true` გვიშლის, რომ ყოველ სხვა click-ზე ისევ ქსელში წავიდეთ.
async function ensureApiDataLoaded() {
    if (apiOccupiedSeatsLoaded) return
    await loadOccupiedSeatsFromApi()
}

async function loadOccupiedSeatsFromApi() {
    const from = localStorage.getItem('from')
    const to = localStorage.getItem('to')
    const date = localStorage.getItem('date')
    const trainNum = localStorage.getItem('train_number')
    if (!from || !to || !date || !trainNum) return

    const fromEnc = renameCity(from)
    const toEnc = renameCity(to)
    
    const url = `https://railway.stepprojects.ge/api/getdeparture?from=${fromEnc}&to=${toEnc}&date=${date}`
    try {
        const response = await fetch(url)
        const data = await response.json()
        if (!Array.isArray(data) || data.length === 0) return
        const first = data[0]
        const trains = first.trains && Array.isArray(first.trains) ? first.trains : (Array.isArray(first) ? first : [])
        const ourTrain = trains.find(t => t && String(t.number) === String(trainNum))
        if (!ourTrain || !ourTrain.vagons) return

        apiOccupiedSeats['I კლასი'] = []
        apiOccupiedSeats['II კლასი'] = []
        apiOccupiedSeats['ბიზნესი'] = []
        apiSeatPrices['I კლასი'] = {}
        apiSeatPrices['II კლასი'] = {}
        apiSeatPrices['ბიზნესი'] = {}
        apiSeatIds['I კლასი'] = {}
        apiSeatIds['II კლასი'] = {}
        apiSeatIds['ბიზნესი'] = {}
        ourTrain.vagons.forEach(v => {
            const vagonName = v.name
            if (!apiOccupiedSeats[vagonName]) apiOccupiedSeats[vagonName] = []
            if (!apiSeatPrices[vagonName]) apiSeatPrices[vagonName] = {}
            if (!apiSeatIds[vagonName]) apiSeatIds[vagonName] = {}
            ;(v.seats || []).forEach(s => {
                const seatCode = s && s.number ? String(s.number).trim() : ""
                if (s && typeof s.price !== 'undefined' && seatCode) {
                    const price = Number(s.price)
                    apiSeatPrices[vagonName][seatCode] = Number.isFinite(price) ? price : 0
                }
                if (s && s.seatId && seatCode) {
                    apiSeatIds[vagonName][seatCode] = String(s.seatId)
                }
                if (s.isOccupied && seatCode) apiOccupiedSeats[vagonName].push(seatCode)
            })
        })
        apiOccupiedSeatsLoaded = true
        updateTotalPrice()
    } catch (e) {
        // API-დან ადგილების ჩატვირთვის შეცდომა — სჩუმად ვტოვებთ
    }
}

function formatGel(amount) {
    const n = Number(amount)
    const safe = Number.isFinite(n) ? n : 0
    return `${safe.toFixed(2)}₾`
}

function updateTotalPrice() {
    const totalInput = document.getElementById('totalPrice')
    if (!totalInput) return

    let total = 0
    for (let s = 1; s <= Number(number || 0); s++) {
        const vName = (vagon[s] && vagon[s].value) ? String(vagon[s].value).trim() : ""
        const seatCode = (seat[s] && seat[s].value) ? String(seat[s].value).trim() : ""
        if (!vName || !seatCode) continue
        const price = apiSeatPrices[vName] && typeof apiSeatPrices[vName][seatCode] !== 'undefined'
            ? Number(apiSeatPrices[vName][seatCode])
            : 0
        if (Number.isFinite(price)) total += price
    }

    totalInput.value = formatGel(total)
    localStorage.setItem('total_price', String(total))
    localStorage.setItem('total_price_formatted', totalInput.value)
}



let passengers = []   // საბოლოო array
const seats = document.getElementById('seats')

form.addEventListener('submit', function(event) {
    event.preventDefault()

    // 7) ვამოწმებთ, რომ ყველა required ველი შევსებულია. თუ არა, submit არ სრულდება.
    if (!form.checkValidity()) {
        form.reportValidity()
        return
    }

    // 7.1) ვასუფთავებთ ძველ localStorage keys-ს (`pasanger-*`), რათა payload არ აირიოს წინა სცადებთან.
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith('pasanger-')) localStorage.removeItem(k)
    }
    localStorage.removeItem('pasanger-count')
    localStorage.removeItem('contact_email')
    localStorage.removeItem('contact_phone')
    localStorage.removeItem('ticket_register_payload')

    const emailVal = (email.value || "").trim()
    const phoneVal = (phoneNumber.value || "").trim()

    const trainIdRaw = localStorage.getItem('train_id')
    const trainId = Number(trainIdRaw)
    if (!Number.isFinite(trainId)) {
        alert('Train ID ვერ მოიძებნა. გთხოვთ თავიდან აირჩიოთ მატარებელი.')
        return
    }

    const dateRaw = localStorage.getItem('date') || ""
    const dateTime = dateRaw.includes('T') ? dateRaw : `${dateRaw}T00:00:00`

    const rows = document.querySelectorAll('.person-id')
    passengers = []

    try {
        const people = Array.from(rows).map((row, index) => {
            const idx = index + 1

            const nameInput = row.querySelector('input[name="name"]')
            const lastnameInput = row.querySelector('input[name="lastname"]')
            const personalInput = row.querySelector('input[name="personal-number"]')
            const seatInput = document.getElementById(`seat${idx}`)
            const vagonInput = document.getElementById(`vagon${idx}`)

            const vagonName = vagonInput ? String(vagonInput.value || '').trim() : ''
            const seatCode = seatInput ? String(seatInput.value || '').trim() : ''
            const seatId = (apiSeatIds[vagonName] && apiSeatIds[vagonName][seatCode]) ? apiSeatIds[vagonName][seatCode] : ''
            if (!seatId) {
                throw new Error(`Seat ID ვერ მოიძებნა (მგზავრი ${idx}: ${vagonName} ${seatCode}).`)
            }

            const p = {
                name: nameInput ? nameInput.value.trim() : "",
                lastname: lastnameInput ? lastnameInput.value.trim() : "",
                personalNumber: personalInput ? personalInput.value.trim() : "",
                seat: seatCode,
                vagon: vagonName
            }
            passengers.push(p)

            return {
                seatId,
                name: p.name,
                surname: p.lastname,
                idNumber: p.personalNumber,
                payoutCompleted: false
            }
        })

        const payload = {
            trainId,
            date: dateTime,
            email: emailVal,
            phoneNumber: phoneVal,
            people
        }

        // 7.2) POST-ის payload-ს ვამზადებთ და ვინახავთ localStorage-ში,
        //       რომ შემდეგ `payment.html`-მა წაიკითხოს ეს მონაცემები და გააგზავნოს.
        localStorage.setItem('ticket_register_payload', JSON.stringify(payload))
    } catch (err) {
        const msg = (err && err.message) ? err.message : String(err)
        alert(msg)
        return
    }

    window.location.href = "payment.html"
})

const choseAseet = document.getElementById('choseAseet')
let exit1 = document.getElementById('exit1')
let exit2 = document.getElementById('exit2')

const number = localStorage.getItem('number')

const fearstClas = document.getElementById('fearstClas')
const secondClas = document.getElementById('secondClas')
const biznes = document.getElementById('biznes')
const h1 = document.getElementById('h1')

// 8) ვაწყობთ seat-grid-ის DOM ელემენტების array-ებს:
//    seatsA..seatsD = span-ები სხვადასხვა რიგში/სვეტში (A/B/C/D).
let seatsA = []
let seatsB = []
let seatsC = []
let seatsD = []
for (let i = 1; i <= 10; i++) {
    seatsA[i] = document.getElementById(`seat${i}A`);
    seatsB[i] = document.getElementById(`seat${i}B`);
    seatsC[i] = document.getElementById(`seat${i}C`);
    seatsD[i] = document.getElementById(`seat${i}D`);
}

function humans() {
    const peopleDiv = document.getElementById('peopleDiv')
    for (let s = 1; s <= number; s++) {        
        const human = document.createElement("tr");
        human.className = "person-id";
        
        human.innerHTML = `
        <h3>მგზავრი ${s}</h3>
        <div class="person-id-cont">
        <div class="shadow">
        <input type="text" name="name" placeholder="სახელი" required>
        <input type="text" name="lastname" placeholder="გვარი" required>
        <input type="number" name="personal-number" placeholder="პირადი ნომერი" class="clasIDNum" required>
        </div>
        <div class="second-div shadow">
        <span class="span-cont">ადგილი: 
        <input type="text" name="seat" id="seat${s}" placeholder="0" style="height: 20px; padding: 0; display: inline; border: none; width: 25px; font-size: 14px; color: #224d80;" readonly required>
        <input type="text" name="vagon" id="vagon${s}" style=" height: 20px; padding: 0; display: inline; border: none; width: 60px; font-size: 14px; color: #224d80;" readonly required>
        </span>
        <span class="span-cont span-in-span pointer" id="choseAseetBTN${s}" visited="none">ადგილის არჩევა</span>
        </div>
        </div>
        `
        peopleDiv.appendChild(human);   
    }
}

humans()

const clasIDNum = document.querySelectorAll('.clasIDNum')

clasIDNum.forEach((input) => {
    input.addEventListener("keydown", (e) => {
        const value = input.value
        if (
            e.key === "Backspace" ||
            e.key === "Delete" ||
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "Tab"
        ) return
        if (value.length >= 11) {
            e.preventDefault()
        }
    })
})



// 9) აქ ვქმნით თითო მგზავრის არჩევის კონტროლებს:
//    `choseAseetBTN[idx]` აკავშირებს ღილაკს UI-დან,
//    ხოლო `seat[idx]` და `vagon[idx]` იქნება committed არჩევანის შენახვა (input-ები).
let choseAseetBTN = []
for (let s = 1; s <= number; s++) {
    choseAseetBTN[s] = document.getElementById(`choseAseetBTN${s}`)
}
let seat = []
for (let s = 1; s <= number; s++) {
    seat[s] = document.getElementById(`seat${s}`)
}
let vagon = []
for (let s = 1; s <= number; s++) {
    vagon[s] = document.getElementById(`vagon${s}`)
}



// 10) withcBtnIsIt — რომელი მგზავრის “ადგილის არჩევის” ეკრანია აქტიური.
//     viewVagon კი წარმოადგენს მხოლოდ UI view-state-ს (რას ვუყურებთ),
//     ხოლო საბოლოო არჩევანი ინახება `vagon[idx]` და `seat[idx]` input-ებში.

let withcBtnIsIt = ''

// 10.1) viewVagon — UI view-state:
//        კლასის/ვაგონის ღილაკზე დაჭერა ცვლის “რას ვუყურებთ ამ მგზავრისთვის”,
//        მაგრამ არ ცვლის committed seat-ს მანამ, სანამ seat-ს არ აირჩევ.
let viewVagon = []
for (let s = 1; s <= number; s++) {
    viewVagon[s] = ''
}

for (let s = 1; s <= number; s++) {
    choseAseetBTN[s].addEventListener('click', async () => {
        
        choseAseet.style.display = "flex"

        withcBtnIsIt = s

        if (choseAseetBTN[s].getAttribute("visited") === "yas") {
            // 11) visited="yas" ნიშნავს, რომ ამ მგზავრს უკვე აქვს არჩევანი (ან მინიმუმ vagon commit).
            //     ამ შემთხვევაში ვაჩვენებთ იგივე vagon-ს და შესაბამის მწვანე/წითელ/ნაცრისფერ მდგომარეობას.
            seats.style.display = "flex"

            const viewForThisPassenger = viewVagon[s] || vagon[s].value || ''
            h1.textContent = viewForThisPassenger
            await ensureApiDataLoaded()

            // 11.1) წითელი მხოლოდ ამ მგზავრის “currentSeatValue”-ზეა:
            //       თუ committed vagon == view vagon, მაშინ მისი seat code წითლად მონიშნავს.
            const seatForView = (vagon[s].value === viewForThisPassenger) ? seat[s].value : ''
            updateSeatsColorsForVagon(viewForThisPassenger, seatForView)
        } else {
            // 11.2) პირველი გახსნა: ვამალავთ grid-ს და მხოლოდ ვაგონის არჩევის მიმართულებას ვაჩვენებთ.
            resetSeatsStyles()
            seats.style.display = "none"
            h1.textContent = "გთხოვთ აირჩიოთ ვაგონი"
        }

    })
}

// 13) resetSeatsStyles:
//     ასუფთავებს ყველა span-ის ფერებს/სტილებს (pointer-events/cursor-იც),
//     რათა შემდეგ `updateSeatsColorsForVagon` თავიდან გადაიტანოს სწორი მდგომარეობა.
function resetSeatsStyles() {
    for (let i = 1; i <= 10; i++) {
        [seatsA[i], seatsB[i], seatsC[i], seatsD[i]].forEach(span => {
            if (span) {
                span.style.backgroundColor = ""
                span.style.color = ""
                span.style.borderColor = ""
                span.style.pointerEvents = ""
                span.style.cursor = ""
            }
        })
    }
}

// 14) updateSeatsColorsForVagon(vagonName, currentSeatValue):
//     ამ ფუნქციამ უნდა “გადახატოს” grid:
//     - თუ seat დაკავებულია API-ით => ნაცრისფერი + დაკლიკვის disabled
//     - თუ seat არჩეულია სხვა მგზავრის მიერ (ourSeats) => მწვანე
//     - თუ ეს seat არის ამ კონკრეტული მგზავრის currentSeatValue => წითელი
function updateSeatsColorsForVagon(vagonName, currentSeatValue) {
    if (!vagonName) return
    const occupiedByApi = (apiOccupiedSeats[vagonName] || [])

    // 12) ჩვენთვის “ჩვენი” არჩეული seat-ები გამოითვლება ყოველ repaint-ზე პირდაპირ input-ებიდან:
    //     ourSeats = { seatCode | vagon[idx].value === vagonName და seat[idx].value != '' }.
    //     ამის გამო წინა selection-ის stale state აღარ რჩება და მწვანე არ “გაეწებება” შეცდომით.
    const ourSeats = new Set()
    for (let i = 1; i <= Number(number || 0); i++) {
        const vn = (vagon[i] && vagon[i].value) ? String(vagon[i].value).trim() : ''
        const sc = (seat[i] && seat[i].value) ? String(seat[i].value).trim() : ''
        if (vn === vagonName && sc) ourSeats.add(sc)
    }

    const currentSeat = currentSeatValue ? String(currentSeatValue).trim() : ''
    for (let i = 1; i <= 10; i++) {
        [seatsA[i], seatsB[i], seatsC[i], seatsD[i]].forEach(span => {
            if (!span) return
            const code = (span.textContent || '').trim()
            const isOccupiedByApi = occupiedByApi.includes(code)
            const isTakenByUs = ourSeats.has(code)

            span.style.pointerEvents = ""
            span.style.cursor = ""
            span.style.backgroundColor = ""
            span.style.color = ""
            span.style.borderColor = ""

            if (isOccupiedByApi) {
                span.style.backgroundColor = "#888"
                span.style.color = "#fff"
                span.style.borderColor = "#666"
                span.style.pointerEvents = "none"
                span.style.cursor = "not-allowed"
            } else if (isTakenByUs) {
                if (currentSeat && code === currentSeat) {
                    span.style.backgroundColor = "red"
                    span.style.color = "white"
                    span.style.borderColor = "red"
                } else {
                    span.style.backgroundColor = "green"
                    span.style.color = "white"
                    span.style.borderColor = "green"
                }
            }
        })
    }
}

// 15) exit ღილაკები:
//     - ასუფთავებს seat-grid-ის სტილებს (`resetSeatsStyles()`),
//     - მალავს seats grid-ს და აბრუნებს მომხმარებელს ვაგონის არჩევის ეკრანზე.
exit1.addEventListener('click', () => {
    resetSeatsStyles()
    choseAseet.style.display = "none"
    h1.textContent= 'გთხოვთ აირჩიოთ ვაგონი'
    seats.style.display = "none"
})
exit2.addEventListener('click', () => {
    resetSeatsStyles()
    choseAseet.style.display = "none"
    h1.textContent= 'გთხოვთ აირჩიოთ ვაგონი'
    seats.style.display = "none"
})
function chosingAseet(){

    async function onVagonClick(vagonName) {
        h1.textContent = vagonName
        seats.style.display = "flex"

        // 16) onVagonClick(vagonName):
        //     ეს click მხოლოდ UI view-ს ცვლის (viewVagon), მაგრამ commit არ ხდება,
        //     სანამ მომხმარებელი კონკრეტულ seat span-ზე არ დააჭერს.
        viewVagon[withcBtnIsIt] = vagonName
        choseAseetBTN[withcBtnIsIt].setAttribute("visited", "yas")
        await ensureApiDataLoaded()

        // 16.1) წითელი seat გამოჩნდება მხოლოდ მაშინ,
        //       თუ committed vagon == ამ გვერდზე ნაჩვენები vagonName.
        const committedSeatValue = (vagon[withcBtnIsIt].value === vagonName) ? seat[withcBtnIsIt].value : ''
        updateSeatsColorsForVagon(vagonName, committedSeatValue)
        updateTotalPrice()
    }
    fearstClas.addEventListener('click', () => onVagonClick("I კლასი"))
    secondClas.addEventListener('click', () => onVagonClick("II კლასი"))
    biznes.addEventListener('click', () => onVagonClick("ბიზნესი"))

    for (let i = 1; i <= 10; i++) {

        function selectSeat(a) {

            // 17) selectSeat(a):
            //     vagonName მოდის viewVagon-დან (რომელ grid-ს ვუყურებთ ახლა),
            //     seatName მოდის იმ span-ის ტექსტიდან, რომელზეც ვაჭერთ.
            let vagonName = viewVagon[withcBtnIsIt] || ''
            let seatName = (a.textContent || '').trim()

            if (!vagonName) return

            const occupiedByApi = (apiOccupiedSeats[vagonName] || [])

            // 17.1) თუ ეს seat დაკავებულია API-ს მიერ, არჩევა არ კეთდება.
            if (occupiedByApi.includes(seatName)) return

            // 17.2) თუ უკვე სხვა მგზავრს აქვს ეს seat არჩეული ამავე vagon-ში, უარვყოფთ.
            for (let i = 1; i <= Number(number || 0); i++) {
                if (i === withcBtnIsIt) continue

                const vn = (vagon[i] && vagon[i].value) ? String(vagon[i].value).trim() : ''
                const sc = (seat[i] && seat[i].value) ? String(seat[i].value).trim() : ''
                if (vn === vagonName && sc === seatName) return
            }

            // 17.3) commit:
            //       ვწერთ არჩევანს input-ებში (`vagon[idx]` და `seat[idx]`).
            //       შესაბამისად, კლასის გადართვა (onVagonClick) აღარ “ქრის” არჩევანს.
            vagon[withcBtnIsIt].value = vagonName
            seat[withcBtnIsIt].value = seatName

            updateSeatsColorsForVagon(vagonName, seatName)
            updateTotalPrice()

        }

        seatsA[i].addEventListener('click', () => selectSeat(seatsA[i]));
        seatsB[i].addEventListener('click', () => selectSeat(seatsB[i]));
        seatsC[i].addEventListener('click', () => selectSeat(seatsC[i]));
        seatsD[i].addEventListener('click', () => selectSeat(seatsD[i]));
    }
}
chosingAseet()

ensureApiDataLoaded().then(() => {
    updateTotalPrice()
})