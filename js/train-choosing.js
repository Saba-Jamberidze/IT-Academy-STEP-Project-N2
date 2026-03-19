
// train-choosing page script:
// localStorage-დან იღებს from, to, date; API getdeparture-ით ტვირთავს მატარებლების სიას.
// თითო მატარებელზე "დაჯავშნა" ინახავს train_id, train_number და ა.შ. და გადაყავს passenger-data.html-ზე.

let from = localStorage.getItem('from')
let to = localStorage.getItem('to')
let date = localStorage.getItem('date')

// ქალაქის სახელის URL-safe მნიშვნელობად გარდაქმნა.
function rename(fromORto){
    if (fromORto === "თბილისი"){
        return "%E1%83%97%E1%83%91%E1%83%98%E1%83%9A%E1%83%98%E1%83%A1%E1%83%98";
    } else if(fromORto === "ბათუმი"){
        return "%E1%83%91%E1%83%90%E1%83%97%E1%83%A3%E1%83%9B%E1%83%98";
    } else if(fromORto === "ფოთი"){
        return "%E1%83%A4%E1%83%9D%E1%83%97%E1%83%98";
    }
    return fromORto;
}

from = rename(from)
to = rename(to)

// API-დან მატარებლების სიის წამოღება.
async function getData(from, to, date){
    const response = await fetch(`https://railway.stepprojects.ge/api/getdeparture?from=${from}&to=${to}&date=${date}`)
    if (!response.ok) {
        const status = response.status || "უცნობი"
        throw new Error(`დაფიქსირდა შეცდომა ${status}`)
    }
    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
        return data[0].trains || [];
    }
    return [];
}

// UI-ში მატარებლების რენდერი და დაჯავშნის ღილაკების მიბმა.
async function displayTickets(){
    const container = document.getElementById("departuresDiv");
    const treinTotFound = document.getElementById("treinTotFound");
    const tableCont = document.querySelector(".table-cont");
    const backToHome = document.getElementById("backToHome");

    if (!container || !treinTotFound) {
        console.warn('departuresDiv (class) or treinTotFound (id) element missing');
        return;
    }

    let trains = []
    try {
        trains = await getData(from, to, date);
    } catch (err) {
        const message = (err && err.message) ? err.message : String(err)
        treinTotFound.textContent = message
        if (tableCont) tableCont.style.display = "none";
        if (backToHome) backToHome.style.display = "block";
        return
    }

    if (!Array.isArray(trains) || trains.length === 0) {
        treinTotFound.textContent = "მატარებლები ვერ მოიძებნა";
        if (tableCont) tableCont.style.display = "none";
        if (backToHome) backToHome.style.display = "block";
        return;
    }

    if (tableCont) tableCont.style.display = "";
    if (backToHome) backToHome.style.display = "none";

    trains.forEach(function(train){
        const tr = document.createElement("tr");
        tr.className = "tr-by-java";

        tr.innerHTML = `
            <div class="table-information th1">
                <span class="border-none">#${train.number}</span>
                <span class="border-none">${train.name} express</span> 
            </div>
            <div class="table-information th2"> 
                <span>${train.departure}</span>
                <span>${train.from}</span>
            </div>
            <div class="table-information th3">
                <span>${train.arrive}</span>
                <span>${train.to}</span>
            </div>
            <div class="table-information th4">
                <button class="book pointer">დაჯავშნა</button>
            </div>
        `;
        container.appendChild(tr);

        const book = tr.querySelector(".book");

        book.addEventListener("click", () => {

            localStorage.setItem("train_id", train.id);
            localStorage.setItem("train_number", train.number);
            localStorage.setItem("train_name", train.name);
            localStorage.setItem("train_departure", train.departure);
            localStorage.setItem("train_arrive", train.arrive);
            window.location.href = "passenger-data.html";
        });

    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayTickets);
} else {
    displayTickets();
}