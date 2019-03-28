const themePreference = localStorage.getItem('theme-preference')
const stylePreference = localStorage.getItem('data-style-preference')
if (themePreference) {
    document.querySelector('html').setAttribute('data-theme', themePreference)
}
if (stylePreference) {
    document.querySelector('html').setAttribute('data-style', stylePreference)
    //trigger spanning!
}
