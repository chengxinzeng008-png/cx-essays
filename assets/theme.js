try {
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.dataset.theme = savedTheme;
  if (localStorage.getItem('cz-font-size') === 'large') document.documentElement.dataset.textSize = 'large';
} catch (error) {}
