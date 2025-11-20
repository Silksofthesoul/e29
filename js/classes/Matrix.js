'use strict';
(function () {
  const { Base, Cell, rndFromArray, rndInt} = $dep.import(['Base', 'Cell', 'rndFromArray', 'rndInt']);

  class Matrix extends Base{
    elRoot = null;

    width  = 1;
    height = 1;
    lib = [0];
    data   = [];

    constructor(params = {}) {
      super({ ...params, name: 'Matrix' });
      const {width, height, lib = []} = params;
      if(lib) this.lib = [...new Set(lib)];
      this.width = width;
      this.height = height;
      this.init();
    }

    init() {
      this.initElement();
      this.initData();
      this.gen();
    }

    initElement() {
      this.elRoot = document.createElement('div');
      this.elRoot.classList.add('matrix');
      return this;
    }

    initData() {
      for(let y = 0; y < this.height; y++) {
        this.data.push([]);
        for(let x = 0; x < this.width; x++) this.data[y].push(new Cell());
      }
    }
    
    gen() {

      for(let y = 0; y < this.height; y++) {
        for(let x = 0; x < this.width; x++) this.data[y][x].value = rndFromArray(this.lib);
      }
      return this;
    }


    render() {
      // Рассчитываем размер клетки так, чтобы матрица максимально заполняла вьюпорт
      const availableWidth = window.innerWidth;
      const availableHeight = window.innerHeight;
      const cellSize = Math.min(
        availableWidth / this.width,
        availableHeight / this.height,
      );
      this.elRoot.style.setProperty('--cell-size', `${cellSize}px`);

      // Очистить предыдущий DOM матрицы
      this.elRoot.innerHTML = '';

      for (let y = 0; y < this.height; y++) {
        const rowEl = document.createElement('div');
        rowEl.classList.add('matrix__row');

        for (let x = 0; x < this.width; x++) {
          const cell = this.data[y][x];
          // Поручаем ячейке самой создать и обновить свой DOM-элемент
          cell.render(rowEl);

          // Волнообразная пульсация: задержка зависит от координат клетки
          const delay = (x + y) * 0.07; // секунды
          if (cell.element) {
            cell.element.style.setProperty('--cell-delay', `${delay}s`);
            cell.element.style.setProperty('--cell-animation-scale-min', `0.${rndInt(1, 99)}`);
            cell.element.style.setProperty('--cell-animation-scale-max', `2.${rndInt(1, 99)}`);
            cell.element.style.setProperty('--cell-animation-opacity-max', `0.${rndInt(1, 99)}`);
            cell.element.style.setProperty('--cell-animation-blur-max', `${rndInt(1, 30)}px`);
            cell.element.style.setProperty('--cell-duration', `2.${rndInt(4, 8)}s`);
          }
        }

        this.elRoot.appendChild(rowEl);
      }

      return this;
    }

    get element (){return this.elRoot;}
  }

  $dep.export({ Matrix });
})();
