'use strict';

//#region variables
var MINE = '💣';
var MARK = '🚩'
var NUM_LIVES = 3;
var gSize = 8;
var gMinse = 12;
var gBoard;
var gLevel;
var gShownCount;
var gIsFirstClick;
var gStartCoord;
var gHintCount;
var gLiveCount;
var gIsHintMode;
var gIsEditMode;
var gIsManuallyMode;
var gHintsTimeout;
var gSafeClickTimeout;
var gTimerInterval;
var gStartTime;
var gSafeClickCount;
var gIsGameOver;
//#endregion
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
}, false);

function initGame() {
    gIsGameOver = false;
    gShownCount = 0;
    gHintCount = 3;
    gLiveCount = NUM_LIVES;
    gSafeClickCount = 3;
    gStartCoord = null;
    gIsFirstClick = true;
    gIsHintMode = false;
    gIsEditMode = false;
    gIsManuallyMode = false;
    gStartTime = null;
    if (gHintsTimeout) clearTimeout(gHintsTimeout);
    gHintsTimeout = null;
    if (gSafeClickTimeout) clearTimeout(gSafeClickTimeout);
    gSafeClickTimeout = null;
    if (gTimerInterval) clearInterval(gTimerInterval);
    gTimerInterval = null;
    gLevel = { ROWS: gSize, COLS: gSize, MINES: gMinse };

    var elTimer = document.querySelector('.timer');
    elTimer.innerText = '00:00';
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = '🙂';
    var elMine = document.querySelector('.mine');
    elMine.innerText = gLevel.MINES + MINE
    var elFlag = document.querySelector('.flag');
    elFlag.innerText = 0 + MARK
    var elManuallyBtn = document.querySelector('.manually');
    elManuallyBtn.disabled = false;
    elManuallyBtn.innerText = 'Manually place mines';

    gBoard = createBoard();
    renderGame();

}
//#region create model
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
//#endregion

//#region renders
function renderGame() {
    renderBoard(gBoard);
    renderHints();
    renderLives();
    renderSafeClickBtn();
    alignment();
}

function renderHints() {
    var strHTML = '';
    for (var i = 0; i < gHintCount; i++) {
        strHTML += `<span class="tooltip">
        <img src="img/inactive-hint.png" class="hint" onclick="giveHint(this)" />
        <span class="tooltiptext">Once you click here you can choose one cell and see it and it's neighbors for 1 sec</span> 
        </span>`;
    }
    var elHints = document.querySelector('.hints');
    elHints.innerHTML = strHTML;
}

function renderLives() {
    var strHTML = '';
    for (var i = 0; i < gLiveCount; i++) {
        strHTML += '<img src="img/lives.png" class="live">';
    }
    var elHints = document.querySelector('.lives');
    elHints.innerHTML = strHTML;
}

function renderSafeClickBtn() {
    var strHTML = `<button onclick="getSafeCell()">Safe Click! (${gSafeClickCount} left)</button>`;
    var elHints = document.querySelector('.safe-click');
    elHints.innerHTML = strHTML;
}

function alignment() {
    var elTable = document.querySelector('table');
    var tableWidth = elTable.offsetWidth;
    var elBtns = document.querySelectorAll('button');
    for (var i = 1; i < elBtns.length - 1; i++) {
        elBtns[i].style.minWidth = (tableWidth / 3) + 'px';
    }
    var timeout = setTimeout(function () {
        var buttonsWidth = 0;
        for (var i = 1; i < elBtns.length - 1; i++) {
            buttonsWidth += elBtns[i].offsetWidth;
        }
        elBtns[0].style.minWidth = buttonsWidth + 'px';
        elBtns[elBtns.length - 1].style.minWidth = buttonsWidth + 'px';
    }, 200);

}

function renderBoard(board) {

    var strHTML = '<table> <tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            var className = `hide cell-${i}-${j}`;
            var content = cell.isMine ? MINE : (cell.minesAroundCount ? cell.minesAroundCount : '');
            strHTML += `<td class="${className}" onmousedown="mouseDown(${i},${j})" onmouseup="mouseUp()"
             onclick="cellClicked(${i},${j})" oncontextmenu="cellMarked(this,${i},${j})"> 
            </td>`
        }
        strHTML += '</tr>\n'
    }
    strHTML += '</tbody> </table>';
    var elContainer = document.querySelector('.board');
    elContainer.innerHTML = strHTML;
}
//#endregion

function getSafeCell() {
    if (!gSafeClickTimeout && gSafeClickCount && !gIsGameOver && (gStartCoord || (gIsManuallyMode && !gIsEditMode))) {
        gSafeClickCount--;
        renderSafeClickBtn();
        alignment();
        var coord = getRandomSafePosition();
        var elCell = document.querySelector(`.cell-${coord.i}-${coord.j}`)
        var cell = gBoard[coord.i][coord.j];
        elCell.classList.remove('hide');
        elCell.classList.add('safe');
        gSafeClickTimeout = setTimeout(function () {
            elCell.classList.remove('safe');
            if (!cell.isShown) elCell.classList.add('hide');
            gSafeClickTimeout = null;
        }, 1500);
    }
}

function getRandomSafePosition() {
    var possibleSafePositions = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            if (!cell.isShown && !cell.isMine) {
                possibleSafePositions.push({ i, j });
            }
        }
    }
    var randIdx = getRandomInt(0, possibleSafePositions.length);
    return possibleSafePositions[randIdx];
}

function giveHint(elImg) {
    if (!gIsHintMode && gStartCoord && !gHintsTimeout) {
        elImg.classList.add('active-hint');
        gIsHintMode = true;
    }
}

function mouseDown(i, j) {
    if ((!i && !j) || (!gIsEditMode && !gIsHintMode && !gBoard[i][j].isShown)) {
        var elSmiley = document.querySelector('.smiley');
        elSmiley.innerText = '😄';
    }
}

function mouseUp() {
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = '🙂';
}

function manuallyCreate() {
    var elManuallyBtn = document.querySelector('.manually');
    gIsManuallyMode = true;
    if (!gIsEditMode) {
        gIsEditMode = true;
        // revael all the cells
        showCell(0, 0);
        gShownCount = 0;
        elManuallyBtn.innerText = 'Choose mines positions!'
    } else {
        gIsEditMode = false;
        elManuallyBtn.innerText = 'Good luck!'
        hideAllCells();
        var elMine = document.querySelector('.mine');
        elMine.innerText = (gLevel.MINES - (NUM_LIVES - gLiveCount)) + MINE
    }
    elManuallyBtn.disabled = true;
}

function cellClicked(i, j) {
    var cell = gBoard[i][j];
    if (gIsEditMode) {
        toggleMineInPosition({ i, j });
    } else if (gIsHintMode) {
        revealNeighbors({ i, j });
    } else if (!cell.isMarked) {
        if (gIsFirstClick) {
            startGame({ i, j });
        }
        if (!cell.isShown) {
            showCell(i, j);
            if (cell.isMine) {
                checkGameOver();
            } else if (isWin()) {
                gameOver(true);
            }
        }
    }
}

function toggleMineInPosition({ i, j }) {
    var elMine = document.querySelector('.mine');
    var elCell = document.querySelector(`.cell-${i}-${j}`)
    var cell = gBoard[i][j];
    var numOfMines = parseInt(elMine.innerText);
    if (cell.isMine) {
        cell.isMine = false;
        numOfMines++;
        elCell.innerText = '';
    }
    else if (numOfMines) {
        cell.isMine = true;
        numOfMines--;
        elCell.innerText = MINE;
    }
    if (!numOfMines) {
        var elManuallyBtn = document.querySelector('.manually');
        elManuallyBtn.disabled = false;
        elManuallyBtn.innerText = 'Start!'
    } else {
        var elManuallyBtn = document.querySelector('.manually');
        elManuallyBtn.disabled = true;
        elManuallyBtn.innerText = 'Choose mines positions!'
    }
    elMine.innerText = numOfMines + MINE
}

function checkGameOver() {
    gLiveCount--;
    renderLives();
    var elMine = document.querySelector('.mine');
    elMine.innerText = (gLevel.MINES - (NUM_LIVES - gLiveCount)) + MINE
    if (!gLiveCount) gameOver();
}

function startGame(coord) {
    gIsFirstClick = false;
    gStartCoord = coord;
    gStartTime = Date.now();
    gTimerInterval = setInterval(startTimer, 100);
    if (!gIsManuallyMode) setMinesOnBaord(gBoard);
    updateMinesAroundCount(gBoard);
    var elManuallyBtn = document.querySelector('.manually');
    elManuallyBtn.disabled = true;
}

function revealNeighbors(coord) {
    gHintCount--;
    gIsHintMode = false;
    var neighborsIndexes = getAllNeighborsIndexes(gBoard, coord.i, coord.j);
    var neighborsIndexesToRevael = [];
    // extract neighbors that already shown
    for (var i = 0; i < neighborsIndexes.length; i++) {
        var r = neighborsIndexes[i].i;
        var c = neighborsIndexes[i].j;
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
        renderHints();
        gHintsTimeout = null;
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

function hideAllCells() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            hideCell({ i, j });
        }
    }
}

function cellMarked(elCell, i, j) {
    if (gStartCoord && !gBoard[i][j].isShown) {
        var cell = gBoard[i][j];
        var elFlag = document.querySelector('.flag');
        var numOfMarked = parseInt(elFlag.innerText);
        if (cell.isMarked) {
            cell.isMarked = false;
            elCell.innerText = '';
            numOfMarked--;

        } else {
            cell.isMarked = true;
            elCell.innerText = MARK;
            numOfMarked++;
        }
        elFlag.innerText = numOfMarked + MARK
    }
}

function setMinesOnBaord(board) {
    // puts the mines
    var minesCoords = getRandomCoords(gLevel.MINES);
    for (var i = 0; i < minesCoords.length; i++) {
        var coord = minesCoords[i];
        board[coord.i][coord.j].isMine = true;
    }
}

function updateMinesAroundCount(board) {
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
        revealCell({ i, j });
        if (!cell.isMine) gShownCount++;
        if (!cell.minesAroundCount && !cell.isMine) {
            expandShown(i, j);
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
    var allPossibleCoords = [];
    for (var i = 0; i < gLevel.ROWS; i++) {
        for (var j = 0; j < gLevel.COLS; j++) {
            if (!isNeighborWithStartCoord({ i, j })) {
                allPossibleCoords.push({ i, j });
            }
        }
    }
    var coords = []
    for (var i = 0; i < num; i++) {
        var randIdx = getRandomInt(0, allPossibleCoords.length);
        coords.push(allPossibleCoords.splice(randIdx, 1)[0]);
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

function gameOver(isWin = false) {
    gIsGameOver = true;
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = isWin ? '😎' : '😢';
    clearInterval(gTimerInterval);
    gTimerInterval = null;
    revealAllMines();
    var elTable = document.querySelector('table');
    elTable.style.pointerEvents = 'none';
}

function isWin() {
    return gShownCount === gLevel.ROWS * gLevel.COLS - gLevel.MINES;
}

function revealAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) revealCell({ i, j });
        }
    }
}

function getAllNeighborsIndexes(board, row, col) {
    var neighborsIndexes = [];
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j >= board[0].length) continue;
            neighborsIndexes.push({ i, j });
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
    else if (level === 'hard' && gSize != 8) {
        gSize = 8;
        gMinse = 12;
        initGame();
    }
    else if (level === 'extreme' && gSize != 12) {
        gSize = 12;
        gMinse = 30;
        initGame();
    }
    else if (!gTimerInterval) initGame();
}

function startTimer() {
    //TODO: need to check if an hour has passed...
    var diff = Date.now() - gStartTime;
    var sec = pad(parseInt((diff % (60 * 1000)) / 1000));
    var min = pad(parseInt((diff / (60 * 1000))));
    var elTimer = document.querySelector('.timer');
    elTimer.innerText = min + ':' + sec;
}

function pad(num) {
    return num < 10 ? '0' + num : num;
}



