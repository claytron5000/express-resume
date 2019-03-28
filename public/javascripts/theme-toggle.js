document.querySelector('#theme-toggle').addEventListener('click', (e) => {
    const html = document.querySelector('html');
    if (html.getAttribute('data-theme') === 'dark') {
        html.setAttribute('data-theme', 'light')
        localStorage.setItem('theme-preference', 'light')
        unFocus();

    }
    else {
        html.setAttribute('data-theme', 'dark')
        localStorage.setItem('theme-preference', 'dark')
        unFocus();
    }
})

document.querySelector('#style-toggle').addEventListener('click', (e) => {
    const nameNode = document.querySelector('.name')
    const splitName = nameNode.innerText.split(' ').reduce((acc, name) => {
        acc.push(name.substring(0, 1))
        acc.push(name.substring(1))
        return acc
    }, [])

    const nameTemplate = (words) => words.reduce((acc, word, index) => {
        return acc + (index % 2 ? `${word}` : index === 0 ? `<span>${word}</span>` : ` <span>${word}</span>`)
    }, '');

    nameNode.innerHTML = nameTemplate(splitName)

    const html = document.querySelector('html');
    if (html.getAttribute('data-style') === 'plain') {
        html.setAttribute('data-style', 'fancy')
        localStorage.setItem('data-style-preference', 'fancy')
        unFocus();

    }
    else {
        html.setAttribute('data-style', 'plain')
        localStorage.setItem('data-style-preference', 'plain')
        unFocus();
    }
})


function unFocus() {
    let tmp = document.createElement("input");
    document.body.prepend(tmp);
    tmp.focus();
    document.body.removeChild(tmp);
    window.scrollTo(0, 0);
}