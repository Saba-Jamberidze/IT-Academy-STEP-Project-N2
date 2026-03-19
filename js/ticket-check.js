// ticket-check page script:
// csckForm — ბილეთის ID-ის შეყვანა; checkTicketStatus — GET /api/tickets/checkstatus/{id};
// makeChanges — ბილეთის ჩვენება; dilate — DELETE /api/tickets/cancel/{id} გაუქმებისთვის;
// dilated — "ბილეთი წარმატებით გაუქმდა" შეტყობინება (id="dileted" HTML-ში).
const csckForm = document.getElementById('csckForm')


const ticket = document.getElementById('ticketSection')
const notFound = document.getElementById('notFound')
const dilated = document.getElementById('dileted')


// ბილეთის ID-ის გაგზავნა შემოწმებაზე.
csckForm.addEventListener('submit', function(e){
    e.preventDefault()

    const id = document.getElementById('ticetid')
    const ticetID = id.value

    const spacer = document.getElementById('ticketSpacer')
    if (spacer) spacer.style.display = ""
    ticket.style.display = "none"
    notFound.style.display = "none"
    dilated.style.display = "none"

    checkTicketStatus(ticetID)
    setCurrentTicketId(ticetID)

})
// API-დან ბილეთის სტატუსის წამოღება.
async function checkTicketStatus(id) {
    const url = `https://railway.stepprojects.ge/api/tickets/checkstatus/${id}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        makeChanges(data)
    }   catch (error) {
        console.error("შეცდომა:", error);
        const spacer = document.getElementById('ticketSpacer')
        if (spacer) spacer.style.display = ""
        ticket.style.display = "none"
        notFound.style.display = "block"
        dilated.style.display = "none"
    }
}
// მიღებული ბილეთის მონაცემებით UI-ის შევსება.
function makeChanges(a){
    const spacer = document.getElementById('ticketSpacer')
    if (spacer) spacer.style.display = "none"
    ticket.style.display = "flex"

    const docTicketId = document.getElementById('ticketId')
    docTicketId.textContent = a.id
    const docDate = document.getElementById('issueDate')
    docDate.textContent = new Date().toISOString().slice(0, 10)
    const docFromCity = document.getElementById('fromCity')
    docFromCity.textContent = a.train.from + " " + a.train.departure
    const docToCity = document.getElementById('toCity')
    docToCity.textContent = a.train.to + " " + a.train.arrive
    const docDepartureDate = document.getElementById('departureDate')
    docDepartureDate.textContent = a.date
    const docContactEmail = document.getElementById('contactEmail')
    docContactEmail.textContent = a.email
    const docContactPhone = document.getElementById('contactPhone')
    docContactPhone.textContent = a.phone

    const passengersBox = document.getElementById('passengersBox')
    
    passengersBox.textContent = " "
    for (let i = 0; i < Object.keys(a.persons).length; i++) {
        const person = a.persons[i];

        const psangers = document.createElement("div")
        psangers.className = "in-d6";
        psangers.innerHTML = `
        <div>
            <span>სახელი: </span><span>${person.name}</span>
        </div>
        <div>
            <span>გვარი: </span><span>${person.surname}</span>
        </div>
        <div>
            <span>პირადი ნომერი: </span><span>${person.idNumber}</span>
        </div>
        <div>
            <span>ადგილი: </span><span>${person.seat.number}</span>
        </div>
        <div class="border-non">
        <span>ვაგონის N: </span><span>${person.seat.vagonId}</span>
        </div>
        `
        passengersBox.appendChild(psangers)        
    }

    const docTotalPaid = document.getElementById('totalPaid')
    docTotalPaid.textContent = a.ticketPrice + ".00₾"
}
const ticketEl = document.getElementById("ticket");

// ticket ბლოკის canvas-ად გადაყვანა.
function captureTicketCanvas() {
    if (!ticketEl) return Promise.resolve(null);
    const originalWidth = ticketEl.style.width;
    const originalPadding = ticketEl.style.padding;
    ticketEl.style.width = "126mm";
    ticketEl.style.padding = "12mm";
    return html2canvas(ticketEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        ticketEl.style.width = originalWidth;
        ticketEl.style.padding = originalPadding;
        return canvas;
    });
}

// ბილეთის ბეჭდვა.
function printDiv() {
    if (!ticketEl) return;
    captureTicketCanvas().then(canvas => {
        if (!canvas) return;
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
                <head><title>ბილეთის ბეჭდვა</title></head>
                <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;">
                    <img src="${canvas.toDataURL("image/png")}" style="max-width:100%;height:auto;" />
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        };
    }).catch(err => console.error(err));
}

// ბილეთის PNG ფაილად გადმოწერა.
function downloadDiv() {
    if (!ticketEl) return;
    captureTicketCanvas().then(canvas => {
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = "ticket.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => console.error(err));
}
let currentTicketId = null

function setCurrentTicketId(id){
    currentTicketId = id
}

const dilate = document.getElementById('dilate')
if (dilate) {
    // ბილეთის გაუქმება არჩეული ID-ით და შესაბამისი სტატუსის ჩვენება.
    dilate.addEventListener('click', () => {
        if (!currentTicketId) return
        fetch(`https://railway.stepprojects.ge/api/tickets/cancel/${currentTicketId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        })
        
        const spacer = document.getElementById('ticketSpacer')
        if (spacer) spacer.style.display = ""
        ticket.style.display = "none"
        notFound.style.display = "none"
        dilated.style.display = "block"

    })
}