const main = require('./public/js/main.js');

console.log('');

main.HelloWorld().then(html => {
    console.log('Hello World');
    console.log(html);
    console.log('');
});

main.HelloWorldContainer().then(html => {
    console.log('Hello World Container');
    console.log(html);
    console.log('');
});

main.LabelContainer().then(html => {
    console.log('Label Container');
    console.log(html);
    console.log('');
});
