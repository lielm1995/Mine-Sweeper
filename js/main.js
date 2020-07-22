'use strict';

var MINE = '💣';
var MARK = '🚩'

var gSize = 12;
var gMinse = 22;
var gBoard;
var gLevel;
var gShownCount;
var gIsFirstClick;
var gStartCoord;
var gHintCount;
var gIsHintMode;
var gHintsTimeout

document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
}, false);

function initGame() {
    gShownCount = 0;
    gHintCount = 3;
    gStartCoord = null;
    gIsFirstClick = true;
    gIsHintMode = false;
    if (gHintsTimeout) clearTimeout(gHintsTimeout);
    gHintsTimeout = null;

    gLevel = { ROWS: gSize, COLS: gSize, MINES: gMinse };
    gBoard = createBoard();
    renderGame();
    alignment();
}

function renderGame() {
    renderBoard(gBoard);
    renderHints();
}

function renderHints() {
    var strHTML = '';
    for (var i = 0; i < gHintCount; i++) {
        strHTML += '<img src="img/inactive-hint.png" class="hint" onclick="giveHint(this)">';
    }
    var elHints = document.querySelector('.hints');
    elHints.innerHTML = strHTML;
}

function giveHint(elImg) {
    if (!gIsHintMode && gStartCoord) {
        elImg.classList.add('active-hint');
        gIsHintMode = true;
    }
}

function createCell(isMine = false) {
    return {
        minesAroundCount: 0,
        isShown: false,
        isMine,
        isMarked: false
    }
}

function createBoard() {
    var board = [];
    for (var i = 0; i < gLevel.ROWS; i++) {
        board[i] = [];
        for (var j = 0; j < gLevel.COLS; j++) {
            board[i][j] = createCell();
        }
    }
    return board;
}
function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            var className = `hide cell-${i}-${j}`;
            var content = cell.isMine ? MINE : (cell.minesAroundCount ? cell.minesAroundCount : '');
            strHTML += `<td class="${className}" onclick="cellClicked(this,${i},${j})" oncontextmenu="cellMarked(this,${i},${j})"> 
            </td>`
        }
        strHTML += '</tr>\n'
    }
    var elContainer = document.querySelector('.board');
    elContainer.innerHTML = strHTML;
}

function cellClicked(elCell, i, j) {
    var cell = gBoard[i][j];
    if (!cell.isMarked) {
        if (gIsFirstClick) {
            gIsFirstClick = false;
            gStartCoord = { i, j };
            setMinesOnBaord(gBoard);
            renderBoard(gBoard);
        }
        if (gIsHintMode) {
            revealNeighbors({ i, j });
        } else {
            if (!cell.isShown) {
                showCell(i, j);
            }
            if (cell.isMine) {
                gameOver();
            }
        }
    }
}

function revealNeighbors(coord) {
    var neighborsIndexes = getAllNeighborsIndexes(gBoard, coord.i, coord.j);
    var neighborsIndexesToRevael = [];
    // extract neighbors that already shown
    for (var i = 0; i < neighborsIndexes.length; i++) {
        var r = neighborsIndexes[i].i;
        var c = neighborsIndexes[i].j;
        console.log(r,c);
        if (!gBoard[r][c].isShown) neighborsIndexesToRevael.push(neighborsIndexes[i]);
    }
    // show the neighbors for one sec
    for (var i = 0; i < neighborsIndexesToRevael.length; i++) {
        revealCell(neighborsIndexesToRevael[i]);
    }
    // hide the neighbors after one sec
    gHintsTimeout = setTimeout(function () {
        for (var i = 0; i < neighborsIndexesToRevael.length; i++) {
            hideCell(neighborsIndexesToRevael[i]);
        }
        gHintCount--;
        gIsHintMode = false;
        renderHints();

    }, 1000)
}

function revealCell(coord) {
    var cell = gBoard[coord.i][coord.j];
    cell.isShown = true;
    var elCell = document.querySelector(`.cell-${coord.i}-${coord.j}`)
    elCell.classList.remove('hide');
    elCell.classList.add('show');
    elCell.innerText = cell.isMine ? MINE : (cell.minesAroundCount ? cell.minesAroundCount : '');
}
function hideCell(coord) {
    var cell = gBoard[coord.i][coord.j];
    cell.isShown = false;
    var elCell = document.querySelector(`.cell-${coord.i}-${coord.j}`)
    elCell.classList.add('hide');
    elCell.classList.remove('show');
    elCell.innerText = cell.isMarked ? MARK : '';
}

function cellMarked(elCell, i, j) {
    if (gStartCoord && !gBoard[i][j].isShown) {
        var cell = gBoard[i][j];

        if (cell.isMarked) {
            cell.isMarked = false;
            elCell.innerText = '';
        } else {
            cell.isMarked = true;
            elCell.innerText = MARK;
        }
    }
}

function setMinesOnBaord(board) {
    // puts the mines
    var minesCoords = getRandomCoords(gLevel.MINES);
    for (var i = 0; i < minesCoords.length; i++) {
        var coord = minesCoords[i];
        board[coord.i][coord.j].isMine = true;
    }
    // update minesAroundCount for every cell
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            cell.minesAroundCount = neighborAreMinesCount(board, i, j);
        }
    }
}

function showCell(i, j) {
    var cell = gBoard[i][j];
    if (!cell.isShown) {
        revealCell({i,j});
        if (!cell.isMine) gShownCount++;
        if (!cell.minesAroundCount && !cell.isMine) {
            expandShown(i, j);
        }
        if (isGameOver()) {
            alert('tada');
        }
    }
}

function expandShown(row, col) {
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (i === row && j === col) continue;
            showCell(i, j);
        }
    }
}

function getRandomCoords(num) {
    var allCoords = [];
    for (var i = 0; i < gLevel.ROWS; i++) {
        for (var j = 0; j < gLevel.COLS; j++) {
            if (!isNeighborWithStartCoord({ i, j })) {
                allCoords.push({ i, j });
            }
        }
    }
    var coords = []
    for (var i = 0; i < num; i++) {
        var randIdx = getRandomInt(0, allCoords.length);
        coords.push(allCoords.splice(randIdx, 1)[0]);
    }
    return coords;
}

function isNeighborWithStartCoord(coord) {
    var diffI = Math.abs(coord.i - gStartCoord.i)
    var diffJ = Math.abs(coord.j - gStartCoord.j)

    return diffI <= 1 && diffJ <= 1;
}

function neighborAreMinesCount(board, row, col) {
    var count = 0;
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= board[0].length) continue;
            if (i === row && j === col) continue;
            if (board[i][j].isMine) count++;
        }
    }
    return count;
}

function gameOver() {
    alert('ppp');
}

function isGameOver() {
    return gShownCount === gLevel.ROWS * gLevel.COLS - gLevel.MINES;
}


function alignment() {
    var elContainer = document.querySelector('.container');
    var elTable = document.querySelector('table');
    var width = elTable.offsetWidth;
    elContainer.style.width = width + 'px';
}

function getAllNeighborsIndexes(board, row, col) {
    var neighborsIndexes = [];
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= board[0].length) continue;
            neighborsIndexes.push({i,j});
        }
    }
    return neighborsIndexes;
}

function changeLevel(level) {
    if ((level === 'easy' && gSize != 4)) {
        gSize = 4;
        gMinse = 2;
        initGame();
    }
    if (level === 'hard' && gSize != 8) {
        gSize = 8;
        gMinse = 12;
        initGame();
    }
    if (level === 'extreme' && gSize != 12) {
        gSize = 12;
        gMinse = 30;
        initGame();
    }
    //if(!gTimerInterval) initGame();
}

// setInterval(function() {console.log(gShownCount);}, 5000)


