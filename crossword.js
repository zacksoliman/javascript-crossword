'use strict';
/*
 * GLOBAL VARS
 */
var state = {
  host: 'http://localhost:3000/',
  board: [], // Keeps track of the puzzle in memory.
  puzzles: [], // Holds all the puzzles that are loaded from the server
  selectedPuzzle: null, // Holds le JSON file of the current puzzle being solved.
  orientation: 'h', // 'h' if we are solving an accross clue and 'v' if it's a down clue
  selectedCell: null, // The row or column currently selected
  selectedClue: null
};

/*
 * Helper Functions
 */
/*
 * Looks up the clue number and returns an object containing the clue number and it's i-j index.
 * The reason if for reusability of the function (see: semiSelectWord())
 */
function lookUpClueNumber($elem) {
  var i, j, num;
  var elemRow = $elem.attr('id').split('_')[1];
  var elemCol = $elem.attr('id').split('_')[2];
  var number = state.selectedPuzzle.numbers;
  var hclues = state.selectedPuzzle.acrossClues;
  var vclues = state.selectedPuzzle.downClues;

  if (state.orientation === 'h') {
    for (j = elemCol; j >= 0; j--) {
      // Find first number, it will indicate the clue index we want
      num = number[elemRow][j];
      if (state.selectedPuzzle.diagram[elemRow][j] === '.') {
        return null;
      }
      if (num > 0 && hclues[num]) {
        return {
          number: num,
          i: elemRow,
          j: j
        };
      }
    }
  } else if (state.orientation === 'v') {
    for (i = elemRow; i >= 0; i--) {
      // Find first number, it will indicate the clue index we want
      num = number[i][elemCol];
      if (state.selectedPuzzle.diagram[i][elemCol] === '.') {
        return null;
      }
      if (num > 0 && vclues[num]) {
        return {
          number: num,
          i: i,
          j: elemCol
        };
      }
    }
  }
  return null;
}

function semiSelectWord($elem) {
  var clueNumber = lookUpClueNumber($elem);
  var row = clueNumber ? clueNumber.i + 1 : null;
  var col = clueNumber ? clueNumber.j + 1 : null;
  var nCols = state.selectedPuzzle.nCols;
  var nRows = state.selectedPuzzle.nRows;
  var i, id;

  if (!row || !col) {
    return;
  }

  if (state.orientation === 'h') {
    // Then we want to semi-select the whole row starting from the var row until we meet a blacked out cell
    for (i = col; i <= nCols; i++) {
      id = '#case_' + row + '_' + i;
      if ($(id).hasClass('noLetter')) {
        return;
      }
      $(id).addClass('semiSelected');
    }
  } else if (state.orientation === 'v') {
    // Then we want to to semi-select the whole column starting from col until we meet a blacked out cell
    for (i = row; i <= nRows; i++) {
      id = '#case_' + i + '_' + col;
      if ($(id).hasClass('noLetter')) {
        return;
      }
      $(id).addClass('semiSelected');
    }
  }
}

function setStyles($elem) {
  $elem.addClass('selected');
  $('.semiSelected').removeClass('semiSelected');
  semiSelectWord($elem);
}

function getPosition(cellId) {
  return cellId.split('-').map(Number);
}

function idValid(board) {
  // TODO
}

/*
 * Handles puzzle navigation using arrow keys and refocuses on new table cell
 * Returns: false if move was unsuccessful, true otherwise.
 */
function move(direction, currentPos) {
  var newId;
  var initialPos = currentPos.slice();
  // TODO: update currentSelection
  $(currentSelection).removeClass('selected');

  if (direction === 'up' && currentPos[0] > 0) {
    currentPos[0]--;
    newId = '#' + currentPos.join('-');
    if (!$(newId).hasClass('blacked-out')) {
      $(newId).focus();
    }
  } else if (direction === 'down' && currentPos[0] < selectedPuzzle.nRows - 1) {
    currentPos[0]++;
    newId = '#' + currentPos.join('-');
    if (!$(newId).hasClass('blacked-out')) {
      $(newId).focus();
    }
  } else if (direction === 'left' && currentPos[1] > 0) {
    currentPos[1]--;
    newId = '#' + currentPos.join('-');
    if (!$(newId).hasClass('blacked-out')) {
      $(newId).focus();
    }
  } else if (direction === 'right' && currentPos[1] < selectedPuzzle.nCols - 1) {
    currentPos[1]++;
    newId = '#' + currentPos.join('-');
    if (!$(newId).hasClass('blacked-out')) {
      $(newId).focus();
    }
  }
}

function toggleOrientation(position) {
  // TODO: update the current clue value if there is a clue associated with
  // the row or column
  switch (clueOrientation) {
    case 'h':
      clueOrientation = 'v';
      break;
    case 'v':
      clueOrientation = 'h';
      break;
    default:
  }
}

function processKey($elem, position, key) {
  $elem.text(key);
  board[position[0]][position[1]] = String.fromCharCode(event.which);

  if (clueOrientation === 'v') {
    move('down', position);
  } else if (clueOrientation === 'h') {
    move('right', position);
  }
}

function keyPressed(event) {
  var $elem = $(this);
  var position = getPosition($elem.attr('id')); // Position is an array [i index, j index]
  var key = event.which.toString();

  event.preventDefault();
  switch (key) {
    case '38':
      move('up', position);
      break;
    case '40':
      move('down', position);
      break;
    case '37':
      move('left', position);
      break;
    case '39':
      move('right', position);
      break;
    case '32': // space bar
      toggleOrientation(position);
      break;
    default:
      processKey($elem, position, String.fromCharCode(event.which));
  }
}

function focused() {
  var $elem = $(this);
  var pos = getPosition($elem.attr('id'));

  $elem.addClass('selected-box');
  setStyles(pos);
}

/*
 * INITIALIZATION FUNCITONS
 * Functions used to initialize the game, the crossword puzzle and the clues
 */

/* Called every time a new puzzle is selected */
function buildCrosswordTable(puzzle) {
  var rows = puzzle.nRows;
  var cols = puzzle.nCols;
  var $crosswordTable = $('#crossword');
  var i, j;
  var $newRow, $td, elem, id;

  $crosswordTable.empty();
  // Set the in memroy board every time we build a new puzzle
  state.board = puzzle.diagram.map(function(row) {
    return row.split('');
  });
  /* Add 1 to rows and cols because we need an extra row and column for the
  numbering */
  for (i = 0; i < rows + 1; i++) {
    $newRow = $('<tr></tr>');
    for (j = 0; j < cols + 1; j++) {
      id = (i - 1) + '-' + (j - 1);
      if (i === 0 && j === 0) {
        $newRow.append('<th></th>');
      } else if (i === 0) { // On the first row we number the columns
        $newRow.append('<th>' + j + '</th>');
      } else if (i > 0 && j === 0) { // On the first column we number the rows
        $newRow.append('<th>' + i + '</th>');
      } else { // Then we just add the crossword puzzle boxes
        elem = '<td id="' + id + '" class=" row-' + (i - 1) + ' col-' + (j - 1) + '" contentEditable="true"></td>';
        $td = $(elem).appendTo($newRow);
        if (state.board[i - 1][j - 1] === '.') {
          $td.addClass('blacked-out');
          $td.attr('contentEditable', 'false');
        }
      }
    }
    $newRow.appendTo($crosswordTable);
  }
  // Put cursor on first puzzle cell for the user;
  $('#0-0').focus();
}

/*
 * Fills the across and down clues
 */
function populateClues() {
  var tableHeight = $('#crossword').height();
  var headingHeight = $('#horizontal h2').outerHeight(true);
  var $horClueList = $('#horizontal-clues ul');
  var $vertClueList = $('#vertical-clues ul');
  var clueNumber, i, j;

  $horClueList.empty();
  $vertClueList.empty();
  $('#horizontal-clues').height(tableHeight - headingHeight);
  $('#vertical-clues').height(tableHeight - headingHeight);

  for (i = 0; i < state.selectedPuzzle.nRows; i++) {
    for (j = 0; j < state.selectedPuzzle.nCols; j++) {
      clueNumber = state.selectedPuzzle.numbers[i][j];
      if (state.selectedPuzzle.acrossClues[clueNumber]) {
        $horClueList.append('<li id="hclue-' + clueNumber + '">' + clueNumber + ': ' + state.selectedPuzzle.acrossClues[clueNumber] + '</li>');
      }
      if (state.selectedPuzzle.downClues[clueNumber]) {
        $vertClueList.append('<li id="vclue-' + clueNumber + '">' + clueNumber + ': ' + state.selectedPuzzle.downClues[clueNumber] + '</li>');
      }
    }
  }
}

/*
 * Fills the list of puzzles the user can select
 */
function populatePuzzleSelection(files) {
  var url, $select;

  $.each(files, function(i, file) {
    url = state.host + 'puzzles/' + file;
    $.getJSON(url, function(data) {
      state.puzzles.push(data);
      $select = $('select').append('<option value="' + i + '">' + file.split('.')[0] + '</option>');
      if (i === 0) {
        state.selectedPuzzle = state.puzzles[$select.val()];
        buildCrosswordTable(state.selectedPuzzle);
        populateClues();
      }
    });
  });
}

function initCrossword() {
  var files = [];

  $('select').change(function(event) {
    state.selectedPuzzle = state.puzzles[event.target.value];
    buildCrosswordTable(state.selectedPuzzle);
  });

  // Fetch all the json files from our server
  $.getJSON(state.host + 'puzzles/puzzle-list.json', function(data) {
    files = data.files;
    populatePuzzleSelection(files);
  });

  $(document).on('focusin', 'td', focused);

  $(document).on('focusout', 'td', function() {
    $(this).removeClass('selected-box');
  });
  /* We use keydown instead of keypress here because we also need to capture the
  arrow keys which aren't captured with all browsers by using keypress */
  $(document).on('keydown', 'td', keyPressed);
}

$(document).ready(function() {
  initCrossword();
});
