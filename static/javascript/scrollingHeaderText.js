const headerText = document.querySelector('.header-text');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Apply a translateY transformation to move the text downwards
    headerText.style.transform = `translateY(${scrollY * 0.5}px)`; // Move 50% of the scroll value

    const opacity = Math.max(1 - scrollY / 500, 0); // Fade out as the user scrolls
    headerText.querySelector('p').style.opacity = opacity;
});
