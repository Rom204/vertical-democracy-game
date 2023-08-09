const canvas = document.getElementById("canvas1");
const context = canvas.getContext("2d");


let canvasPosition = canvas.getBoundingClientRect();

// mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1,
  };

canvas.addEventListener("mousemove", function (e) {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
    console.log(mouse, canvasPosition)
  });
  
//   canvas.addEventListener("mouseleave", function () {
//     mouse.x = undefined;
//     mouse.y = undefined;
//   });
console.log(canvasPosition);