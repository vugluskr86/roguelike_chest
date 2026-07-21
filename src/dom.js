export const dom = {};
export function initDom(){
  dom.cv = document.getElementById('board');
  dom.ctx = dom.cv.getContext('2d');
  dom.logEl = document.getElementById('log');
  dom.wheelEl = document.getElementById('wheel');
  dom.shahEl = document.getElementById('shah');
  dom.faceInfo = document.getElementById('faceInfo');
  dom.overlay = document.getElementById('overlay');
  dom.modalBox = document.getElementById('modalBox');
  dom.mTitle = document.getElementById('mTitle');
  dom.mText = document.getElementById('mText');
  dom.mChoices = document.getElementById('mChoices');
}
