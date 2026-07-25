/**
 * src/dom.js — кеширование DOM-элементов и инициализация ссылок.
 * Экспорты: dom (объект), initDom().
 */
export const dom = {};
export function initDom() {
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
  // трёхчастная оболочка модалки: шапка с картинкой, тело со скроллом, футер
  dom.mArt = document.getElementById('mArt');
  dom.mBody = document.getElementById('mBody');
  dom.mActions = document.getElementById('mActions');
  dom.hungerBar = document.getElementById('hungerBar');
  dom.hungerRibs = document.querySelector('.hunger-ribs');
  // контейнеры раскладки — нужны resizeBoard(), чтобы отмерить высоту доски
  dom.topbar = document.getElementById('topbar');
  dom.controlCard = document.getElementById('controlCard');
}
