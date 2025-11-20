'use strict';
(function () {
  const { Base } = $import(['Base']);

  class Cell extends Base{
    elRoot = null;
    value = null;

    constructor(params = {}) {
      super({ ...params, name: 'Cell' });
      const { value = null } = params;
      if (value ) this.value = value;
    }

    // Рендерит ячейку и (опционально) добавляет её в переданный родительский элемент строки
    render(parentEl) {
      if (!this.elRoot) {
        this.elRoot = document.createElement('div');
        this.elRoot.classList.add('matrix__cell');
      }

      // Сбросить модификаторы цвета и обновить по текущему value
      this.elRoot.className = 'matrix__cell';

      if (this.value !== null && this.value !== undefined) {
        const colorClass = `matrix__cell--m-${this.value}`;
        this.elRoot.classList.add(colorClass);
        // Для отладки можно отобразить значение:
        // this.elRoot.textContent = this.value;
      } else {
        this.elRoot.textContent = '';
      }

      if (parentEl) parentEl.appendChild(this.elRoot);

      return this;
    }

    get element (){return this.elRoot;}
  }

  $dep.export({ Cell });
})();
