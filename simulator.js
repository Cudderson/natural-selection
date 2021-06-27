document.addEventListener("DOMContentLoaded", f);

function f () {
    var message = 'hello, world! This is a javascript string.';
    var placeholder = document.getElementById("test");

    placeholder.innerHTML = message;

    console.log("Javascript working.");
}
