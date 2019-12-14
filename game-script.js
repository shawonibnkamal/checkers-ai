//initialize board
var activeBoard = {};
var gridSize = 0;
var boardOriginPos = 0;
var maxDepth = 8;

//initialize value for players
var black = -1;
var blackKing = -1.1;
var red = 1;
var redKing = 1.1;
var clear = 0;

//Player colors
var player = red;
var cpu = black;

// Function used to create a new board that we are going to copy in future
function createBoard() {
  let boardInit = [
    [red, clear, red, clear, red, clear, red, clear],
    [clear, red, clear, red, clear, red, clear, red],
    [red, clear, red, clear, red, clear, red, clear],
    [clear, clear, clear, clear, clear, clear, clear, clear],
    [clear, clear, clear, clear, clear, clear, clear, clear],
    [clear, black, clear, black, clear, black, clear, black],
    [black, clear, black, clear, black, clear, black, clear],
    [clear, black, clear, black, clear, black, clear, black]
  ];

  // Creating grids and the pieces that are going to be placed on the board
  let grids = [];
  let pieces = [];
  for (let i = 0; i < boardInit.length; i++) {
    let row = boardInit[i];
    for (let j = 0; j < row.length; j++) {
      let colValue = row[j];
      if (colValue != clear) {
        let piece = { row: i, col: j, state: colValue };
        pieces.push(piece);
      }
      let grid = { row: i, col: j, state: colValue };
      grids.push(grid);
    }
  }

  return { grids: grids, pieces: pieces, turn: black };
}
// Function to change wich player the human is and wich player the cpu is
function changePieces() {
  // Riding the html select 1 is for red and 0 is for blacks
  // Black is choose by default
  if (document.getElementById("player_choose").value == 1) {
    player = red;
    cpu = black;
  } else {
    player = black;
    cpu = red;
  }
}
// Function to transform the grid array to real coordinates
// We set the origin (0,0) that is going to be used for movements references
function mapgridToCoordinates(origin, width, grid) {
  let key = "" + grid.row + ":" + grid.col;
  if (!mapgridToCoordinates.answers) mapgridToCoordinates.answers = {};
  if (mapgridToCoordinates.answers[key] != null) {
    return mapgridToCoordinates.answers[key];
  }
  let x = origin.x + grid.col * width;
  let y = origin.y + grid.row * width;
  return (mapgridToCoordinates.answers[key] = { x: x, y: y });
}
// The opositive to the last function, we pass coordinates and we receive positions in the array
// When I say array I am refering to the board because it is build by arrays
function mapCoordinatesTogrid(origin, width, grids, x, y) {
  // We place 8 because it is supposed all the checkers boards are 8 * 8
  let numSquares = 8;
  let boardLength = numSquares * width;
  if (x > origin.x + boardLength) return null;
  if (y > origin.y + boardLength) return null;
  let col = Math.ceil((x - origin.x) / width) - 1;
  let row = Math.ceil((y - origin.y) / width) - 1;
  let index = row * numSquares + col;
  let grid = grids[index];

  return grid;
}
// This function is to reset all the game (positions, score, messages, states, etc)
function initiateGame(origin, gridWidth, boardInterface) {
  movePiece.moves = [];
  d3.select("#btnReplay").style("display", "none");
  gridSize = gridWidth;
  boardOriginPos = origin;
  activeBoard = drawBoard(origin, gridWidth, boardInterface);
  activeBoard.ui = true;
  showGameState();
  changePieces();
  resetLog();
}
// Function to execute an action
function movePiece(GameState, piece, fromgrid, togrid, moveNum) {
  //console.log(GameState);
  if (GameState.ui) {
    if (movePiece.moves == null) {
      movePiece.moves = [];
    }
    movePiece.moves.push({
      piece: { col: piece.col, row: piece.row, state: piece.state },
      from: { col: fromgrid.col, row: fromgrid.row },
      to: { col: togrid.col, row: togrid.row }
    });
  }
  // This is a call to the fuction in case we could capture more than one piece according with the rules
  let capturedPiece = getcapturedPiece(
    GameState.grids,
    GameState.pieces,
    fromgrid,
    togrid
  );

  // Getting from (index of the array position) where we are moving
  let fromIndex = getgridIndex(fromgrid.row, fromgrid.col);
  // Getting to we are moving
  let toIndex = getgridIndex(togrid.row, togrid.col);
  // Updating the movement in the current board
  if ((togrid.row === 0 || togrid.row === 8) && Math.abs(piece.state) === 1) {
    GameState.grids[toIndex].state = piece.state * 1.1;
  } else {
    GameState.grids[toIndex].state = piece.state;
  }
  GameState.grids[fromIndex].state = clear;
  if ((togrid.row === 0 || togrid.row === 7) && Math.abs(piece.state) === 1) {
    piece.state = piece.state * 1.1;
  }
  piece.col = togrid.col;
  piece.row = togrid.row;
  // Calling the function to move a piece automatically if is cpu turn
  if (GameState.ui && (GameState.turn === cpu || moveNum > 1)) {
    moveCircle(togrid, moveNum);
  }
  // Getting the position wgere we are going to have the next movement automatically
  if (capturedPiece != null) {
    let capturedIndex = getPieceIndex(
      GameState.pieces,
      capturedPiece.row,
      capturedPiece.col
    );
    let originialcapturePieceState = capturedPiece.state;
    capturedPiece.state = 0;

    let gridIndex = getgridIndex(capturedPiece.row, capturedPiece.col);
    let capturedgrid = GameState.grids[gridIndex];
    capturedgrid.state = clear;
    GameState.pieces[capturedIndex].lastCol =
      GameState.pieces[capturedIndex].col;
    GameState.pieces[capturedIndex].lastRow =
      GameState.pieces[capturedIndex].row;
    GameState.pieces[capturedIndex].col = -1;
    GameState.pieces[capturedIndex].row = -1;
    // We have to hide the circle we use to animate the second capture in the current activated board
    if (GameState.ui) {
      hideCircle(capturedgrid, moveNum);
    }
    // Is the board we are analizing is the activate or current board
    if (GameState.ui) {
      movePiece.moves.push({
        piece: {
          col: capturedPiece.col,
          row: capturedPiece.row,
          state: originialcapturePieceState
        },
        from: { col: capturedgrid.col, row: capturedgrid.row },
        to: { col: -1, row: -1 }
      });
    }

    // In the case there are more pieces to capture in one single movement
    let more_moves = getLegalMoves(GameState, piece, GameState.turn);
    let another_move = null;
    for (let i = 0; i < more_moves.length; i++) {
      more_move = more_moves[i];
      if (more_move.move_type === "capture") {
        another_move = more_move;
        break;
      }
    }
    if (another_move != null) {
      moveNum += 1;
      GameState = movePiece(
        GameState,
        piece,
        another_move.from,
        another_move.to,
        moveNum
      );
      // Updating all the movements we made
      if (GameState.ui && GameState.turn === player) {
        GameState.numPlayerMoves += moveNum;
      }
    }
  }

  return GameState;
}
// Getting the index of x and y like indexOf
function getgridIndex(row, col) {
  let numSquares = 8;
  let index = row * numSquares + col;
  return index;
}
// Getting the index of a x and y piece
function getPieceIndex(pieces, row, col) {
  let index = -1;
  for (let i = 0; i < pieces.length; i++) {
    let piece = pieces[i];
    if (piece.row === row && piece.col === col) {
      index = i;
      break;
    }
  }
  return index;
}
// How many pieces we have in the board helps to know who is winning
function getPieceCount(GameState) {
  let numRed = 0;
  let numBlack = 0;
  let pieces = GameState.pieces;
  for (let i = 0; i < pieces.length; i++) {
    let piece = pieces[i];
    if (piece.col >= 0 && piece.row >= 0) {
      if (piece.state === red || piece.state === redKing) {
        numRed += 1;
      } else if (piece.state === black || piece.state === blackKing) {
        numBlack += 1;
      }
    }
  }

  return { red: numRed, black: numBlack };
}
// Get the score to know who is winning
function getScore(GameState) {
  let pieceCount = getPieceCount(GameState);
  let score = pieceCount.red - pieceCount.black;
  return score;
}
// Get who wins
function getWinner(GameState) {
  let pieceCount = getPieceCount(GameState);
  if (pieceCount.red > 0 && pieceCount.black === 0) {
    return red;
  } else if (pieceCount.black > 0 && pieceCount.red === 0) {
    return black;
  } else return 0;
}

// Fuction we use to know if the player is draging a piece
function dragStarted(d) {
  d3.select(this).classed("dragging", true);
}
// Know if the plaer have to capture a piece according with the rules
function obligation(d, type) {
  let have_to_capt = true;
  let posible_movemenst = getAvailableMoves(player, activeBoard);
  let movements = [];
  for (let i = 0; i < posible_movemenst.length; i++) {
    if (posible_movemenst[i].move_type == "capture") {
      movements.push(posible_movemenst[i]);
    }
  }
  if (movements.length > 0) {
    for (let i = 0; i < movements.length; i++) {
      // When the drag starts
      if (type == "start") {
        if (movements[i].from.col == d.col && movements[i].from.row == d.row) {
          have_to_capt = false;
          break;
        }
      }
      // When the drag ends
      if (type == "end") {
        if (movements[i].to.col == d.col && movements[i].to.row == d.row) {
          have_to_capt = false;
          break;
        }
      }
    }
  } else {
    have_to_capt = false;
  }
  return have_to_capt;
}
// When the player is goind to move a piece
function dragged(d) {
  console.log(d.state + " " + Math.round(d.state));
  if (d.state != player && Math.round(d.state) != player) return;
  // So we notice the player is in the obligation to capture
  if (obligation(d, "start")) {
    console.log("You must capture the right piece");
    addLog("You must capture the right piece");
    return;
  }
  let c = d3.select(this);
  d3.select(this)
    .attr("cx", (d.x = d3.event.x))
    .attr("cy", (d.y = d3.event.y));
  showColor();
}
// Animating a movement
function moveCircle(grid, moveNum) {
  let gridCoordinates = mapgridToCoordinates(boardOriginPos, gridSize, grid);
  activeBoard.delay = moveNum * 500 + 500;
  d3.selectAll("circle").each(function(d, i) {
    if (d.col === grid.col && d.row === grid.row) {
      d3.select(this)
        .transition()
        .delay(500 * moveNum)
        .attr("cx", (d.x = gridCoordinates.x + gridSize / 2))
        .attr("cy", (d.y = gridCoordinates.y + gridSize / 2));
    }
  });
}
// Hidding in case we have multiple captures in a single movement
function hideCircle(grid, moveNum) {
  activeBoard.delay = moveNum * 600 + 500;
  d3.selectAll("circle").each(function(d, i) {
    if (d.state === 0 && d.lastRow === grid.row && d.lastCol === grid.col) {
      console.log("Hide col=" + grid.col + ", row=" + grid.row);
      d3.select(this)
        .transition()
        .delay(600 * moveNum)
        .style("display", "none");
    }
  });
}
// When the animations ends
function dragEnded(origin, width, node, d) {
  if (d.state != player && Math.round(d.state) != player) return;
  let grid = mapCoordinatesTogrid(origin, width, activeBoard.grids, d.x, d.y);
  let from = d;
  let to = grid;
  if (to == undefined) {
    to = from;
  }

  //console.log(to);
  // We analize if movement is legal and if not we undo the action
  let legal = isMoveLegal(activeBoard.grids, activeBoard.pieces, d, from, to);
  let index = getgridIndex(d.row, d.col);
  let originalgrid = activeBoard.grids[index];
  if (obligation(to, "end")) {
    console.log("You must capture the right piece");
    legal = false;
  }
  if (!legal) {
    let gridCoordinates = mapgridToCoordinates(origin, width, originalgrid);
    node
      .attr("cx", (d.x = gridCoordinates.x + width / 2))
      .attr("cy", (d.y = gridCoordinates.y + width / 2));
  } else {
    // Uodate movements in the active board
    activeBoard = movePiece(activeBoard, d, originalgrid, grid, 1);

    // Getting the coordinates of the center of the piece
    let gridCoordinates = mapgridToCoordinates(origin, width, grid);
    node
      .attr("cx", (d.x = gridCoordinates.x + width / 2))
      .attr("cy", (d.y = gridCoordinates.y + width / 2));

    let score = getScore(activeBoard);
    showGameState();

    activeBoard.turn = cpu;

    // cpu's move
    let delayCallback = function() {
      // We analize if the player wins if not we let the cpu move
      let winner = getWinner(activeBoard);
      if (winner != 0) {
        activeBoard.gameOver = true;
      } else {
        cpuMove();
      }
      updateScoreboard();
      return true;
    };

    let moveDelay = activeBoard.delay;
    setTimeout(delayCallback, moveDelay);
  }
  showImage();
}
// We get the postion of the piece we capture
function getcapturedPiece(grids, pieces, from, to) {
  let distance = { x: to.col - from.col, y: to.row - from.row };
  if (Math.abs(distance.x) == 2) {
    let captureRow = from.row + checkSign(distance.y);
    let captureCol = from.col + checkSign(distance.x);
    let index = getPieceIndex(pieces, captureRow, captureCol);
    let capturedPiece = pieces[index];
    return capturedPiece;
  } else return null;
}
// Analizing if the movement is legal action
function isMoveLegal(grids, pieces, piece, from, to) {
  // Piece out of board
  if (to.col < 0 || to.row < 0 || to.col > 7 || to.row > 7) {
    return false;
  }
  // No diagonal movement
  let distance = { x: to.col - from.col, y: to.row - from.row };
  if (distance.x == 0 || distance.y == 0) {
    return false;
  }
  if (Math.abs(distance.x) != Math.abs(distance.y)) {
    return false;
  }
  // Moving more than 1 square
  if (Math.abs(distance.x) > 2) {
    return false;
  }
  // If the destiny is not clear
  if (to.state != clear) {
    return false;
  }
  // If make a capture movement and there is not piece to capture
  if (Math.abs(distance.x) == 2) {
    let capturedPiece = getcapturedPiece(grids, pieces, from, to);
    if (capturedPiece == null) {
      return false;
    }
    // If the player wants to capture his own piece
    let pieceState = integ(piece.state);
    let capturedState = integ(capturedPiece.state);
    if (pieceState != -capturedState) {
      return false;
    }
  }
  if (
    integ(piece.state) === piece.state &&
    checkSign(piece.state) != checkSign(distance.y)
  ) {
    return false;
  }

  return true;
}
// Function to draw the board
function drawBoard(origin, gridWidth, boardInterface) {
  let GameState = createBoard();
  let grids = GameState.grids;
  let pieces = GameState.pieces;

  boardInterface
    .append("defs")
    .append("pattern")
    .attr("id", "red")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 70)
    .attr("height", 70)
    .append("image")
    .attr("xlink:href", "images/red.png")
    .attr("width", 70)
    .attr("height", 70);

  boardInterface
    .select("defs")
    .append("pattern")
    .attr("id", "black")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 70)
    .attr("height", 70)
    .append("image")
    .attr("xlink:href", "images/black.png")
    .attr("width", 70)
    .attr("height", 70);

  boardInterface
    .select("defs")
    .append("pattern")
    .attr("id", "redKing")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 70)
    .attr("height", 70)
    .append("image")
    .attr("xlink:href", "images/redKing.png")
    .attr("width", 70)
    .attr("height", 70);

  boardInterface
    .select("defs")
    .append("pattern")
    .attr("id", "blackKing")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 70)
    .attr("height", 70)
    .append("image")
    .attr("xlink:href", "images/blackKing.png")
    .attr("width", 70)
    .attr("height", 70);

  //Drawing grid rectangles
  boardInterface
    .append("g")
    .selectAll("rect")
    .data(grids)
    .enter()
    .append("rect")
    .attr("x", function(d) {
      return mapgridToCoordinates(origin, gridWidth, d).x;
    })
    .attr("y", function(d) {
      return mapgridToCoordinates(origin, gridWidth, d).y;
    })
    .attr("height", gridWidth)
    .attr("width", gridWidth)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", "1px");

  //Drawing pieces
  let dragEndedDimensions = function(d) {
    node = d3.select(this);
    dragEnded(origin, gridWidth, node, d);
  };

  let drag = d3
    .drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEndedDimensions);

  boardInterface
    .append("g")
    .selectAll("circle")
    .data(pieces)
    .enter()
    .append("circle")
    .attr("r", gridWidth / 3)
    .attr("cx", function(d) {
      let x = mapgridToCoordinates(origin, gridWidth, d).x;
      return x + gridWidth / 2;
    })
    .attr("cy", function(d) {
      let y = mapgridToCoordinates(origin, gridWidth, d).y;
      return y + gridWidth / 2;
    })
    .style("fill", function(d) {
      if (d.state == red) return "red";
      else return "black";
    })
    .style("fill", function(d) {
      if (d.state == red) return "url(#red)";
      else return "url(#black)";
    })
    .call(drag);

  //Drawing scoreboard
  d3.select("#divScoreboard").remove();
  d3.select("#scoreBoardContainer")
    .append("div")
    .attr("id", "divScoreboard");
  /*.style("font-size", "36")
  .html("Score");*/

  /*d3.select("#divScoreboard")
    .append("div")
    .style("font-size", "30")
    .attr("id", "winner");*/

  d3.select("#divScoreboard")
    .append("div")
    .attr("id", "redScoreHeading")
    .style("font-size", "25")
    .html("Player Red");

  d3.select("#divScoreboard")
    .append("div")
    .attr("id", "redScore")
    .style("font-size", "15")
    .html("Remaining: 12 <br> Captured: 0 <br><br>");

  d3.select("#divScoreboard")
    .append("div")
    .attr("id", "redScoreHeading")
    .style("font-size", "25")
    .html("Player Black");

  d3.select("#divScoreboard")
    .append("div")
    .attr("id", "blackScore")
    .style("font-size", "15")
    .html("Remaining: 12 <br> Captured: 0 <br><br>");

  let i = 1;
  while (i <= 64) {
    boardInterface
      .selectAll("rect:nth-child(" + i + ")")
      .style("fill", "black");

    if (i % 8 == 7) {
      i += 3;
    } else if (i % 8 == 0) {
      i += 1;
    } else {
      i += 2;
    }
  }

  return GameState;
}

function showColor() {
  boardInterface.selectAll("circle").style("fill", function(d) {
    if (d.state == red || d.state == redKing) return "#e8232a";
    else if (d.state == black || d.state == blackKing) return "#383838";
  });
}

function showImage() {
  boardInterface.selectAll("circle").style("fill", function(d) {
    if (d.state == red) return "url(#red)";
    else if (d.state == black) return "url(#black)";
    else if (d.state == redKing) return "url(#redKing)";
    else if (d.state == blackKing) return "url(#blackKing)";
  });
}

function addLog(text) {
  let messageBody = document.getElementById("log");
  messageBody.innerHTML += text + "<br>";

  messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
}

function resetLog() {
  let messageBody = document.getElementById("log");
  messageBody.innerHTML = "";
}

function updateScoreboard() {
  let pieceCount = getPieceCount(activeBoard);
  let pieceCapturedRed = 12 - pieceCount.red;
  let pieceCapturedBlack = 12 - pieceCount.black;
  let redLabel =
    "Remaining: " +
    pieceCount.red +
    " <br> Captured:" +
    pieceCapturedRed +
    "<br><br>";
  let blackLabel =
    "Remaining: " +
    pieceCount.black +
    " <br> Captured:" +
    pieceCapturedBlack +
    "<br><br>";

  d3.select("#redScore").html(redLabel);
  d3.select("#blackScore").html(blackLabel);

  let winner = getWinner(activeBoard);
  let winnerLabel = "";
  if (winner === player) {
    winnerLabel = "You Won!";
  } else if (winner === cpu) {
    winnerLabel = "You Lost!";
  }

  if (winner != 0) {
    d3.select("#btnReplay").style("display", "inline");
  }

  addLog(winnerLabel);
}
// functiosn to helps with cals
// Integer part
function integ(num) {
  if (num != null) return Math.round(num);
  else return null;
}

// + or -
function checkSign(num) {
  if (num < 0) return -1;
  else return 1;
}

// Function to know the current board state
function showGameState() {
  d3.selectAll("text").each(function(d, i) {
    d3.select(this).style("display", "none");
  });

  let grids = activeBoard.grids;
  let pieces = activeBoard.pieces;
  //drawText(grids);
  //drawText(pieces);
}

// Function to copy the board to make possible movements
function copyBoard(board) {
  let newBoard = {};
  newBoard.ui = false;
  let grids = [];
  let pieces = [];

  for (let i = 0; i < board.grids.length; i++) {
    let grid = board.grids[i];
    let newgrid = { row: grid.row, col: grid.col, state: grid.state };
    grids.push(newgrid);
  }
  for (let i = 0; i < board.pieces.length; i++) {
    let piece = board.pieces[i];
    let newPiece = { row: piece.row, col: piece.col, state: piece.state };
    pieces.push(newPiece);
  }

  return { grids: grids, pieces: pieces, turn: board.turn };
}
// Function to obtain player pieces
function getPlayerPieces(player, targetBoard) {
  player_pieces = [];
  for (let i = 0; i < targetBoard.pieces.length; i++) {
    let piece = targetBoard.pieces[i];
    if (
      piece.state === player ||
      piece.state === player + 0.1 ||
      piece.state === player - 0.1
    ) {
      player_pieces.push(piece);
    }
  }
  return player_pieces;
}
// Get index in the board
function getGridIndex(targetBoard, col, row) {
  let index = -1;
  for (let i = 0; i < targetBoard.grids.length; i++) {
    let grid = targetBoard.grids[i];
    if (grid.col === col && grid.row === row) {
      index = i;
      break;
    }
  }
  return index;
}
// Getting available moves for a piece
function getLegalMoves(targetBoard, target_piece, player) {
  let moves = [];
  let from = target_piece;
  // Normal moves
  let x = [-1, 1];
  x.forEach(function(entry) {
    let grid_index = getGridIndex(
      targetBoard,
      from.col + entry,
      from.row + player * 1
    );
    if (grid_index >= 0) {
      let to = targetBoard.grids[grid_index];
      if (isMoveLegal(targetBoard.grids, targetBoard.pieces, from, from, to)) {
        move = {
          move_type: "slide",
          piece: player,
          from: { col: from.col, row: from.row },
          to: { col: to.col, row: to.row }
        };
        moves[moves.length] = move;
      }
    }
  });
  // capture moves

  x = [-2, 2];
  x.forEach(function(entry) {
    let grid_index = getGridIndex(
      targetBoard,
      from.col + entry,
      from.row + player * 2
    );
    if (grid_index >= 0) {
      let to = targetBoard.grids[grid_index];
      if (isMoveLegal(targetBoard.grids, targetBoard.pieces, from, from, to)) {
        move = {
          move_type: "capture",
          piece: player,
          from: { col: from.col, row: from.row },
          to: { col: to.col, row: to.row }
        };
        moves[moves.length] = move;
      }
    }
  });

  // Analizing movements for kings
  if (Math.abs(from.state) === 1.1) {
    // check for slides
    let x = [-1, 1];
    let y = [-1, 1];
    x.forEach(function(xmove) {
      y.forEach(function(ymove) {
        let grid_index = getGridIndex(
          targetBoard,
          from.col + xmove,
          from.row + ymove
        );
        if (grid_index >= 0) {
          let to = targetBoard.grids[grid_index];
          if (
            isMoveLegal(targetBoard.grids, targetBoard.pieces, from, from, to)
          ) {
            move = {
              move_type: "slide",
              piece: player,
              from: { col: from.col, row: from.row },
              to: { col: to.col, row: to.row }
            };
            moves[moves.length] = move;
          }
        }
      });
    });

    // Checking for kings captures
    x = [-2, 2];
    y = [-2, 2];
    x.forEach(function(xmove) {
      y.forEach(function(ymove) {
        let grid_index = getGridIndex(
          targetBoard,
          from.col + xmove,
          from.row + ymove
        );
        if (grid_index >= 0) {
          let to = targetBoard.grids[grid_index];
          if (
            isMoveLegal(targetBoard.grids, targetBoard.pieces, from, from, to)
          ) {
            move = {
              move_type: "capture",
              piece: player,
              from: { col: from.col, row: from.row },
              to: { col: to.col, row: to.row }
            };
            moves[moves.length] = move;
          }
        }
      });
    });
  }

  return moves;
}
// Get available all the available movements
function getAvailableMoves(player, targetBoard) {
  let moves = [];
  let move = null;
  let player_pieces = getPlayerPieces(player, targetBoard);

  for (let i = 0; i < player_pieces.length; i++) {
    let from = player_pieces[i];
    let piece_moves = getLegalMoves(targetBoard, from, player);
    moves.push.apply(moves, piece_moves);
  }

  let captureMoves = [];
  for (let i = 0; i < moves.length; i++) {
    let move = moves[i];
    if (move.move_type == "capture") {
      captureMoves.push(move);
    }
  }
  if (captureMoves.length > 0) {
    moves = captureMoves;
  }
  return moves;
}
//If we want a random move in the case we have many equal evaluated movements
function selectRandomMove(moves) {
  let index = Math.floor(Math.random() * (moves.length - 1));
  let selected_move = moves[index];

  return selected_move;
}
// Set the depth
function setDepth() {
  value = document.getElementById("depth_value").value;
  maxDepth = value;
}
// Alpha betha initialization
function alphaBetaSearch(currState, limit) {
  let alpha = Number.NEGATIVE_INFINITY;
  let beta = Infinity;

  //Getting available moves for cpu
  let available_moves = getAvailableMoves(cpu, currState);

  //Getting max value for each available move
  let max = alphaBeta(currState, available_moves, limit, alpha, beta, true);

  //Fing all max moves
  let best_moves = [];
  let max_move = null;
  for (let i = 0; i < available_moves.length; i++) {
    let next_move = available_moves[i];
    if (next_move.score == max) {
      max_move = next_move;
      best_moves.push(next_move);
    }
  }

  //We use the function we created to make random movement incase we have many equal evaluated moves
  if (best_moves.length > 1) {
    max_move = selectRandomMove(best_moves);
  }

  return max_move;
}

function cpuMove() {
  // Copying the board
  let nextState = copyBoard(activeBoard);

  // Start alpha betha
  let selected_move = alphaBetaSearch(nextState, maxDepth);

  // Let the cpu player moves
  let pieceIndex = getPieceIndex(
    activeBoard.pieces,
    selected_move.from.row,
    selected_move.from.col
  );
  let piece = activeBoard.pieces[pieceIndex];
  activeBoard = movePiece(
    activeBoard,
    piece,
    selected_move.from,
    selected_move.to,
    1
  );
  moveCircle(selected_move.to, 1);
  showGameState();
  // Analizing if cpu wins if not we let the player move again
  let winner = getWinner(activeBoard);
  if (winner != 0) {
    activeBoard.gameOver = true;
  } else {
    activeBoard.turn = player;
    activeBoard.delay = 0;
  }
}

//Analizing if there is an oportunity to capture more than one piece in a single turn
function captureAvailable(available_moves) {
  let capture = false;
  for (let i = 0; i < available_moves.length; i++) {
    let move = available_moves[i];
    if (move.move_type == "capture") {
      capture = true;
      break;
    }
  }

  return capture;
}
// The minimax function
function alphaBeta(currState, moves, limit, alpha, beta, max) {
  var v;
  if (limit <= 0 && !captureAvailable(moves)) {
    return eval(currState);
  }
  if (max) {
    let max = Number.NEGATIVE_INFINITY;
    if (moves.length > 0) {
      for (let i = 0; i < moves.length; i++) {
        nextState = copyBoard(currState);
        let cpuMove = moves[i];
        let pieceIndex = getPieceIndex(
          nextState.pieces,
          cpuMove.from.row,
          cpuMove.from.col
        );
        let piece = nextState.pieces[pieceIndex];
        nextState = movePiece(nextState, piece, cpuMove.from, cpuMove.to);
        let humanMoves = getAvailableMoves(player, nextState);
        let minScore = alphaBeta(
          nextState,
          humanMoves,
          limit - 1,
          alpha,
          beta,
          !max
        );
        moves[i].score = minScore;
        if (minScore > max) {
          max = minScore;
        }
        if (max >= beta) {
          break;
        }
        if (max > alpha) {
          alpha = max;
        }
      }
    }
    v = max;
  } else {
    let min = Infinity;
    if (moves.length > 0) {
      for (let i = 0; i < moves.length; i++) {
        nextState = copyBoard(currState);
        let humanMove = moves[i];
        let pieceIndex = getPieceIndex(
          nextState.pieces,
          humanMove.from.row,
          humanMove.from.col
        );
        let piece = nextState.pieces[pieceIndex];
        nextState = movePiece(nextState, piece, humanMove.from, humanMove.to);
        let cpuMoves = getAvailableMoves(cpu, nextState);
        let maxScore = alphaBeta(
          nextState,
          cpuMoves,
          limit - 1,
          alpha,
          beta,
          !max
        );

        if (maxScore < min) {
          min = maxScore;
        }
        moves[i].score = min;
        if (min <= alpha) {
          break;
        }
        if (min < beta) {
          beta = min;
        }
      }
    }
    v = min;
  }
  return v;
}

// Eval function, here we analize different things in roder to determine what is the best or the bests movements
// Some of the evaluations are :
// The piece postion center or side
// How many pieces the player and the cpu have if the board we analize
// have less cpu pieces it is going to be best evaluated
function eval(targetBoard) {
  let sum = 0;
  let cpuPieces = 0;
  let cpuKings = 0;
  let humanPieces = 0;
  let humanKings = 0;
  let cpuPosSum = 0;
  let humanPosSum = 0;

  for (let i = 0; i < targetBoard.pieces.length; i++) {
    let piece = targetBoard.pieces[i];
    if (piece.row > -1) {
      //Counting pieces in the board
      if (piece.state === player || piece.state === Math.round(piece.state)) {
        // Player pieces
        humanPieces += 1;
        if (Math.round(piece.state) === player) {
          humanKings += 1;
        }
        let human_pos = evalPosition(piece.col, piece.row);
        humanPosSum += human_pos;
      } else {
        // cpu pieces
        cpuPieces += 1;
        if (Math.round(piece.state) === cpu) {
          cpuKings += 1;
        }
        let cpu_pos = evalPosition(piece.col, piece.row);
        cpuPosSum += cpu_pos;
      }
    }
  }
  // Making an average of all pieces
  let pieceDifference = cpuPieces - humanPieces;
  let kingDifference = cpuKings - humanKings;
  if (humanPieces === 0) {
    humanPieces = 0.00001;
  }
  let avgHumanPos = humanPosSum / humanPieces;
  if (cpuPieces === 0) {
    cpuPieces = 0.00001;
  }
  let avg_cpu_pos = cpuPosSum / cpuPieces;
  let avgPosDiff = avg_cpu_pos - avgHumanPos;

  let features = [pieceDifference, kingDifference, avgPosDiff];
  let weights = [100, 10, 1];

  let eval = 0;

  for (let f = 0; f < features.length; f++) {
    let fw = features[f] * weights[f];
    eval += fw;
  }
  // return how good is the current board
  return eval;
}

// Evaluationg all the possible movements we can do if we are in the middle of the
// board we have less opportunities because the piece could be captured
function evalPosition(x, y) {
  if (x == 0 || x == 7 || y == 0 || y == 7) {
    return 5;
  } else {
    return 3;
  }
}
