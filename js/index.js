// index page script:
// მართავს ქალაქების არჩევას (საიდან/სად), თარიღს, მგზავრთა რაოდენობას და ფორმის submit-ს.
// localStorage-ში ინახება: from, to, date, number; შემდეგ გადამისამართება train-choosing.html-ზე.

const fromChooser = document.getElementById('formChooser');
const formChooserContainer = document.getElementById('formChooserConteiner');

const toChooser = document.getElementById('toChooser');
const toChooserContainer = document.getElementById('toChooserConteiner');

const from = document.getElementById('from')
const tbilisiFrom = document.getElementById('tbilisiFrom')
const batumiFrom = document.getElementById('batumiFrom')
const potiFrom = document.getElementById('potiFrom')

const to = document.getElementById('to')
const tbilisiTo = document.getElementById('tbilisiTo')
const batumiTo = document.getElementById('batumiTo')
const potiTo = document.getElementById('potiTo')

function isHidden(el) {
    if (!el) return true
    return window.getComputedStyle(el).display === 'none'
}

function show(el) {
    if (!el) return
    el.style.display = 'flex'
}

function hide(el) {
    if (!el) return
    el.style.display = 'none'
}

// FROM dropdown-ის გახსნა/დახურვა.
fromChooser.addEventListener('click', () => {
    if (isHidden(formChooserContainer)){
        show(formChooserContainer)
        formChooserContainer.style.zIndex = "100"
    }else hide(formChooserContainer)
    
});

// TO dropdown-ის გახსნა/დახურვა.
toChooser.addEventListener('click', (e) => {
    // თუ თვითონ dropdown-ში დააკლიკა (ოპციებზე), toggle არ გვინდა
    if (toChooserContainer && toChooserContainer.contains(e.target)) return
    if (isHidden(toChooserContainer)) show(toChooserContainer)
    else hide(toChooserContainer)
});

const fromOptions = { "თბილისი": tbilisiFrom, "ბათუმი": batumiFrom, "ფოთი": potiFrom }
const toOptions = { "თბილისი": tbilisiTo, "ბათუმი": batumiTo, "ფოთი": potiTo }

// option-ს ვუკონტროლებთ clickable მდგომარეობას (აქტიური/ინაქტიური).
function setOptionEnabled(option, enabled) {
    if (!option) return
    option.style.pointerEvents = enabled ? "" : "none"
    option.style.opacity = enabled ? "1" : "0.6"
}

// არ ვაძლევთ მომხმარებელს იგივე ქალაქის არჩევას ორივე მხარეს.
function updateOptionsState() {
    const fromVal = from.value
    const toVal = to.value
    Object.entries(toOptions).forEach(([city, el]) => {
        setOptionEnabled(el, city !== fromVal)
    })
    Object.entries(fromOptions).forEach(([city, el]) => {
        setOptionEnabled(el, city !== toVal)
    })
    if (fromVal && toVal === fromVal) to.value = ""
    if (toVal && fromVal === toVal) from.value = ""
}

// dropdown-ის კონკრეტული ვარიანტის არჩევა input-ში.
function ChosingFromTo(a, input, container, isFrom) {
    a.addEventListener('click', (e) => {
        e.stopPropagation()
        const otherInput = isFrom ? to : from
        const options = isFrom ? toOptions : fromOptions
        let city = ""
        if (a === tbilisiFrom || a === tbilisiTo) city = "თბილისი"
        else if (a === batumiFrom || a === batumiTo) city = "ბათუმი"
        else if (a === potiFrom || a === potiTo) city = "ფოთი"
        if (city && city === otherInput.value) return
        input.value = city
        updateOptionsState()
        hide(container)
    })
}

ChosingFromTo(tbilisiFrom, from, formChooserContainer, true);
ChosingFromTo(batumiFrom, from, formChooserContainer, true);
ChosingFromTo(potiFrom, from, formChooserContainer, true);

ChosingFromTo(tbilisiTo, to, toChooserContainer, false);
ChosingFromTo(batumiTo, to, toChooserContainer, false);
ChosingFromTo(potiTo, to, toChooserContainer, false);

updateOptionsState();

// გარეთ დაკლიკებაზე ორივე dropdown დაიხუროს
document.addEventListener('click', (e) => {
    if (formChooserContainer && !formChooserContainer.contains(e.target) && !fromChooser.contains(e.target)) {
        hide(formChooserContainer)
    }
    if (toChooserContainer && !toChooserContainer.contains(e.target) && !toChooser.contains(e.target)) {
        hide(toChooserContainer)
    }
})

const plusNumbers = document.getElementById('plusNumbers')
const number = document.getElementById('number')
const minusNumbers = document.getElementById('minusNumbers')

// მგზავრთა რაოდენობის გაზრდა.
plusNumbers.addEventListener("click", () => {
    number.value = parseInt(number.value) + 1
})

// მგზავრთა რაოდენობის შემცირება (მინიმუმ 1).
minusNumbers.addEventListener('click', () => {
    if (parseInt(number.value) > 1) {
        number.value = parseInt(number.value) - 1;
    }
});

const dateInput = document.getElementById('date');

// თარიღის input: დღესზე ნაკლები თარიღი არ დაიშვას და default იყოს დღეს.
const today = new Date();

const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');

const formattedDate = `${year}-${month}-${day}`;

dateInput.setAttribute('min', formattedDate);
dateInput.value = formattedDate;



const indexForm = document.getElementById("indexForm");

// form submit: მონაცემების შენახვა localStorage-ში და შემდეგ გვერდზე გადასვლა.
indexForm.addEventListener("submit", function(e){
    e.preventDefault(); //რეფრეში NO!

    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const people = document.getElementById("date").value;
    const number = document.getElementById("number").value;


    localStorage.setItem("from", from);
    localStorage.setItem("to", to);
    localStorage.setItem("date", people);
    localStorage.setItem("number", number);

    window.location.href = "train-choosing.html";
});