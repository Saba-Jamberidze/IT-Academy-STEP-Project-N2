// payment page script:
// totalToPay — localStorage total_price-დან; pay — POST /api/tickets/register;
// checkTicketStatus — GET /api/tickets/checkstatus/{id}; makeChanges — ბილეთის DOM შევსება;
// captureTicketCanvas, printDiv, downloadDiv — html2canvas-ით ბეჭდვა/გადმოწერა.
const form = document.getElementById('paymentForm');

// localStorage-დან საერთო თანხის ჩვენება.
function totalToPay() {
    const totalToPay = document.getElementById('totalToPay');
    if (!totalToPay) return;
    totalToPay.textContent = localStorage.getItem('total_price') + ".00₾";
}
totalToPay();

// გადახდის ფორმის submit -> ticket register API.
function pay() {
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const lastInformationForPost = localStorage.getItem('ticket_register_payload');
        if (!lastInformationForPost) {
            console.error("localStorage-ში ვერ ვიპოვე 'ticket_register_payload'");
            return;
        }

        fetch('https://railway.stepprojects.ge/api/tickets/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: lastInformationForPost
        })
        .then(res => res.text())
        .then(data => {
            const ticketId = data.split("ბილეთის ნომერია:")[1]
            checkTicketStatus(ticketId)
        })
        .catch(err => {
            console.error(err)
        })
    })
}
pay();
// რეგისტრაციის შემდეგ ticket სტატუსის გადამოწმება.
async function checkTicketStatus(id) {
    if (!id) {
        console.error("ცარიელი ან არასწორი ticketId:", id);
        return;
    }

    const url = `https://railway.stepprojects.ge/api/tickets/checkstatus/${id}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        makeChanges(data);
    } catch (error) {
        console.error("შეცდომა:", error);
    }
}

// წარმატებულ პასუხზე ბილეთის DOM შევსება.
function makeChanges(a){
    const ticket = document.getElementById('ticketSection')
    const h1 = document.getElementById('inSectH1')

    const card = document.getElementById('cardid')
    const owner = document.getElementById('owner')

    ticket.style.display = "flex"
    form.style.display = "none"
    h1.textContent = "ბილეთები წარმატებით დაიჯავშნა"

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

    const docPeimentInfo = document.getElementById('peimentInfo')
    docPeimentInfo.textContent = owner.value + "'s"
    const docCardMasked = document.getElementById('cardMasked')
    docCardMasked.textContent = card.value.slice(0, 4) + " **** **** " + card.value.slice(-4)
    const docTotalPaid = document.getElementById('totalPaid')
    docTotalPaid.textContent = localStorage.getItem('total_price') + ".00₾"
}
const ticket = document.getElementById("ticket");

// ticket ბლოკის canvas-ად გადაყვანა (ბეჭდვა/გადმოწერისთვის).
function captureTicketCanvas() {
    if (!ticket) return null;
    const originalWidth = ticket.style.width;
    const originalPadding = ticket.style.padding;
    ticket.style.width = "126mm";
    ticket.style.padding = "12mm";
    return html2canvas(ticket, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        ticket.style.width = originalWidth;
        ticket.style.padding = originalPadding;
        return canvas;
    });
}

// ბილეთის ბეჭდვა.
function printDiv() {
    if (!ticket) return;
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

// ბილეთის PNG-ად გადმოწერა.
function downloadDiv() {

    if (!ticket) return;

    captureTicketCanvas().then(canvas => {
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = "ticket.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => console.error(err));
}