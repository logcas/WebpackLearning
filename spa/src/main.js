import './main.scss';
import myImg from './images/2.jpg';
const hello = () => {
  console.log('ES6箭头函数222');
}

hello();

window.onload = function() {
  let img = new Image();
  img.src = myImg;
  document.body.appendChild(img);
}