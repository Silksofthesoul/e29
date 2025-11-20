'use strict';
(function () {
  const { Scene, Matrix, rndInt, int } = $dep.import(['Scene', 'Matrix', 'rndInt', 'int']);


  // matrix
  const lib = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // const lib = [1, 2, 3];
  // const width = int( window.innerWidth / 20 ) - 1;
  // const height = int( window.innerHeight / 20 ) - 1;

  // Размерность матрицы подстраиваем под размер окна, чтобы максимально покрывать вьюпорт
  const baseCellSize = 64; // целевой размер клетки (px)

  function createMatrix() {
    const width = Math.max(1, int(window.innerWidth / baseCellSize));
    const height = Math.max(1, int(window.innerHeight / baseCellSize));
    const matrix = new Matrix({ width, height, lib });
    matrix.gen();
    return matrix;
  }

  // scene
  const scene = new Scene();
  let matrix = createMatrix();

  scene
    .append('matrix', matrix)
    .render();

  // При изменении размеров окна пересоздаём матрицу с новой размерностью
  window.addEventListener('resize', () => {
    matrix = createMatrix();
    scene
      .append('matrix', matrix)
      .render();
  });

})();
