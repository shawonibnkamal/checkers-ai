//initialize value for players
var black = 1;
var blackKing = 1.1;
var red = -1;
var redKing = -1.1;
var clear = 0;

//Player colors
var player = red;
var computer = black;

//initialize board
var activeBoard = {};
var gridSize = 0;
var boardOriginPos = 0;
var maxDepth = 8;

function createBoard() {
  let boardInit = [
    [black, clear, black, clear, black, clear, black, clear],
    [clear, black, clear, black, clear, black, clear, black],
    [black, clear, black, clear, black, clear, black, clear],
    [clear, clear, clear, clear, clear, clear, clear, clear],
    [clear, clear, clear, clear, clear, clear, clear, clear],
    [clear, red, clear, red, clear, red, clear, red],
    [red, clear, red, clear, red, clear, red, clear],
    [clear, red, clear, red, clear, red, clear, red]
  ];

  let grids = new Array();
  let pieces = new Array();
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
function change_pieces() {
  if (document.getElementById("player_choose").value == 1) {
    player = red;
    computer = black;
  } else {
    player = black;
    computer = red;
  }
}
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

function mapCoordinatesTogrid(origin, width, grids, x, y) {
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

function startGame(origin, gridWidth, boardCanvas) {
  movePiece.moves = [];
  d3.select("#btnReplay").style("display", "none");
  gridSize = gridWidth;
  boardOriginPos = origin;
  activeBoard = drawBoard(origin, gridWidth, boardCanvas);
  activeBoard.ui = true;
  showBoardState();
  change_pieces();
  resetLog();
}

function replayAll(origin, gridWidth, boardCanvas) {
  let allMoves = movePiece.moves;
  startGame(origin, gridWidth, boardCanvas);
  activeBoard.turn = 0; // can't really play
  for (let i = 0; i < allMoves.length; i++) {
    let moveNum = i + 1;
    let nextMove = allMoves[i];
    if (nextMove.to.row > -1) {
      let gridCoordinates = mapgridToCoordinates(
        boardOriginPos,
        gridSize,
        nextMove.to
      );
      d3.selectAll("circle").each(function(d, i) {
        if (d.col === nextMove.from.col && d.row === nextMove.from.row) {
          d3.select(this)
            .transition()
            .delay(500 * moveNum)
            .attr("cx", (d.x = gridCoordinates.x + gridSize / 2))
            .attr("cy", (d.y = gridCoordinates.y + gridSize / 2));

          d.col = nextMove.to.col;
          d.row = nextMove.to.row;
        }
      });
    } else {
      d3.selectAll("circle").each(function(d, i) {
        if (d.row === nextMove.from.row && d.col === nextMove.from.col) {
          d3.select(this)
            .transition()
            .delay(500 * moveNum)
            .style("display", "none");
          d.col = -1;
          d.row = -1;
        }
      });
    }
  }
}

function undoMove(move, moveNum) {
  if (move.to.row > -1) {
    let gridCoordinates = mapgridToCoordinates(
      boardOriginPos,
      gridSize,
      move.from
    );
    d3.selectAll("circle").each(function(d, i) {
      if (d.col === move.to.col && d.row === move.to.row) {
        d3.select(this)
          .transition()
          .delay(500 * moveNum)
          .attr("cx", (d.x = gridCoordinates.x + gridSize / 2))
          .attr("cy", (d.y = gridCoordinates.y + gridSize / 2));

        d.col = move.from.col;
        d.row = move.from.row;
      }
    });
    let toIndex = getgridIndex(move.to.row, move.to.col);
    let grid = activeBoard.grids[toIndex];
    grid.state = 0;
    let fromIndex = getgridIndex(move.from.row, move.from.col);
    grid = activeBoard.grids[fromIndex];
    grid.state = move.piece.state;
    //let pieceIndex = getPieceIndex(activeBoard.pieces, move.to.row, move.to.col);
    //let piece = activeBoard.pieces[pieceIndex];
    //piece.col = move.from.col;
    //piece.row = move.from.row;
  } else {
    d3.selectAll("circle").each(function(d, i) {
      if (d.lastRow === move.from.row && d.lastCol === move.from.col) {
        d3.select(this)
          .transition()
          .delay(500 * moveNum)
          .style("display", "block");
        d.col = move.from.col;
        d.row = move.from.row;

        let fromIndex = getgridIndex(move.from.row, move.from.col);
        let grid = activeBoard.grids[fromIndex];
        grid.state = move.piece.state;
        let pieceIndex = getPieceIndex(
          activeBoard.pieces,
          move.from.row,
          move.from.col
        );
        let piece = activeBoard.pieces[pieceIndex];
        piece.col = move.from.col;
        piece.row = move.from.row;
        piece.state = move.piece.state;
      }
    });
  }
}

function undo(numBack) {
  let computerUndo = 0;
  let lastTurn = player;
  let moveNum = 0;
  while (true) {
    moveNum += 1;
    let lastMove = movePiece.moves.pop();
    if (lastMove == null) {
      break;
    }
    if (lastTurn === player && lastMove.piece.state === computer) {
      computerUndo += 1;
      if (computerUndo > numBack) {
        break;
      }
    }
    if (lastMove.to.col > -1) {
      lastTurn = lastMove.piece.state;
    }
    undoMove(lastMove, moveNum);
    showBoardState();
  }
}

function movePiece(boardState, piece, fromgrid, togrid, moveNum) {
  if (boardState.ui) {
    if (movePiece.moves == null) {
      movePiece.moves = [];
    }
    movePiece.moves.push({
      piece: { col: piece.col, row: piece.row, state: piece.state },
      from: { col: fromgrid.col, row: fromgrid.row },
      to: { col: togrid.col, row: togrid.row }
    });
  }

  // Get jumped piece
  let jumpedPiece = getJumpedPiece(
    boardState.grids,
    boardState.pieces,
    fromgrid,
    togrid
  );

  // Update states
  let fromIndex = getgridIndex(fromgrid.row, fromgrid.col);
  let toIndex = getgridIndex(togrid.row, togrid.col);
  if ((togrid.row === 0 || togrid.row === 8) && Math.abs(piece.state) === 1) {
    boardState.grids[toIndex].state = piece.state * 1.1;
  } else {
    boardState.grids[toIndex].state = piece.state;
  }
  boardState.grids[fromIndex].state = clear;
  if ((togrid.row === 0 || togrid.row === 7) && Math.abs(piece.state) === 1) {
    piece.state = piece.state * 1.1;
  }
  piece.col = togrid.col;
  piece.row = togrid.row;

  if (boardState.ui && (boardState.turn === computer || moveNum > 1)) {
    moveCircle(togrid, moveNum);
  }

  if (jumpedPiece != null) {
    let jumpedIndex = getPieceIndex(
      boardState.pieces,
      jumpedPiece.row,
      jumpedPiece.col
    );
    let originialJumpPieceState = jumpedPiece.state;
    jumpedPiece.state = 0;

    let gridIndex = getgridIndex(jumpedPiece.row, jumpedPiece.col);
    let jumpedgrid = boardState.grids[gridIndex];
    jumpedgrid.state = clear;
    boardState.pieces[jumpedIndex].lastCol = boardState.pieces[jumpedIndex].col;
    boardState.pieces[jumpedIndex].lastRow = boardState.pieces[jumpedIndex].row;
    boardState.pieces[jumpedIndex].col = -1;
    boardState.pieces[jumpedIndex].row = -1;
    if (boardState.ui) {
      hideCircle(jumpedgrid, moveNum);
    }

    if (boardState.ui) {
      movePiece.moves.push({
        piece: {
          col: jumpedPiece.col,
          row: jumpedPiece.row,
          state: originialJumpPieceState
        },
        from: { col: jumpedgrid.col, row: jumpedgrid.row },
        to: { col: -1, row: -1 }
      });
    }

    // Another jump?
    let more_moves = get_available_piece_moves(
      boardState,
      piece,
      boardState.turn
    );
    let another_move = null;
    for (let i = 0; i < more_moves.length; i++) {
      more_move = more_moves[i];
      if (more_move.move_type === "jump") {
        another_move = more_move;
        break;
      }
    }
    if (another_move != null) {
      moveNum += 1;
      boardState = movePiece(
        boardState,
        piece,
        another_move.from,
        another_move.to,
        moveNum
      );
      if (boardState.ui && boardState.turn === player) {
        boardState.numPlayerMoves += moveNum;
      }
    }
  }

  return boardState;
}

function getgridIndex(row, col) {
  let numSquares = 8;
  let index = row * numSquares + col;
  return index;
}

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

function getPieceCount(boardState) {
  let numRed = 0;
  let numBlack = 0;
  let pieces = boardState.pieces;
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

function getScore(boardState) {
  let pieceCount = getPieceCount(boardState);
  let score = pieceCount.red - pieceCount.black;
  return score;
}

function getWinner(boardState) {
  let pieceCount = getPieceCount(boardState);
  if (pieceCount.red > 0 && pieceCount.black === 0) {
    return red;
  } else if (pieceCount.black > 0 && pieceCount.red === 0) {
    return black;
  } else return 0;
}

/* SIDE EFFECT FUNCTIONS: UI and Board State */
function dragStarted(d) {
  d3.select(this).classed("dragging", true);
}

function obligation(d, type) {
  let have_to_capt = true;
  let posible_movemenst = get_available_moves(player, activeBoard);
  let movements = [];
  for (let i = 0; i < posible_movemenst.length; i++) {
    if (posible_movemenst[i].move_type == "jump") {
      movements.push(posible_movemenst[i]);
    }
  }
  if (movements.length > 0) {
    for (let i = 0; i < movements.length; i++) {
      if (type == "start") {
        if (movements[i].from.col == d.col && movements[i].from.row == d.row) {
          //console.log(movements);
          have_to_capt = false;
          break;
        }
      }
      if (type == "end") {
        if (movements[i].to.col == d.col && movements[i].to.row == d.row) {
          //console.log(movements);
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
function dragged(d) {
  console.log(d.state + " " + Math.round(d.state));
  if (d.state != player && Math.round(d.state) != player) return;

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

function dragEnded(origin, width, node, d) {
  if (d.state != player && Math.round(d.state) != player) return;
  let grid = mapCoordinatesTogrid(origin, width, activeBoard.grids, d.x, d.y);
  let from = d;
  let to = grid;
  if (to == undefined) {
    to = from;
  }
  //console.log("Im here");
  console.log(to);

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
    // Update global board state
    activeBoard = movePiece(activeBoard, d, originalgrid, grid, 1);

    // Center circle in grid
    let gridCoordinates = mapgridToCoordinates(origin, width, grid);
    node
      .attr("cx", (d.x = gridCoordinates.x + width / 2))
      .attr("cy", (d.y = gridCoordinates.y + width / 2));

    let score = getScore(activeBoard);
    showBoardState();

    activeBoard.turn = computer;

    // Computer's move
    let delayCallback = function() {
      let winner = getWinner(activeBoard);
      if (winner != 0) {
        activeBoard.gameOver = true;
      } else {
        computerMove();
      }
      updateScoreboard();
      return true;
    };

    let moveDelay = activeBoard.delay;
    setTimeout(delayCallback, moveDelay);
  }
  showImage();
}
/* END SIDE EFFECT FUNCTIONS */

function getJumpedPiece(grids, pieces, from, to) {
  let distance = { x: to.col - from.col, y: to.row - from.row };
  if (abs(distance.x) == 2) {
    let jumpRow = from.row + sign(distance.y);
    let jumpCol = from.col + sign(distance.x);
    let index = getPieceIndex(pieces, jumpRow, jumpCol);
    let jumpedPiece = pieces[index];
    return jumpedPiece;
  } else return null;
}

function isMoveLegal(grids, pieces, piece, from, to) {
  if (to.col < 0 || to.row < 0 || to.col > 7 || to.row > 7) {
    //console.log("ILLEGAL MOVE: piece going off board");
    return false;
  }
  let distance = { x: to.col - from.col, y: to.row - from.row };
  if (distance.x == 0 || distance.y == 0) {
    //console.log("ILLEGAL MOVE: horizontal or vertical move");
    return false;
  }
  if (abs(distance.x) != abs(distance.y)) {
    //console.log("ILLEGAL MOVE: non-diagonal move");
    return false;
  }
  if (abs(distance.x) > 2) {
    //console.log("ILLEGAL MOVE: more than two diagonals");
    return false;
  }
  /* TODO: handle double jump
    if ((abs(distance.x) == 1) && double_jump) {
        return false;
    }
    */
  if (to.state != clear) {
    //console.log("ILLEGAL MOVE: grid is not clear");
    return false;
  }
  if (abs(distance.x) == 2) {
    let jumpedPiece = getJumpedPiece(grids, pieces, from, to);
    if (jumpedPiece == null) {
      //console.log("ILLEGAL MOVE: no piece to jump");
      return false;
    }
    let pieceState = integ(piece.state);
    let jumpedState = integ(jumpedPiece.state);
    if (pieceState != -jumpedState) {
      //console.log("ILLEGAL MOVE: can't jump own piece");
      return false;
    }
  }
  if (
    integ(piece.state) === piece.state &&
    sign(piece.state) != sign(distance.y)
  ) {
    //console.log("ILLEGAL MOVE: wrong direction");
    return false;
  }

  return true;
}

function drawBoard(origin, gridWidth, boardCanvas) {
  let boardState = createBoard();
  let grids = boardState.grids;
  let pieces = boardState.pieces;

  boardCanvas
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

  boardCanvas
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

  boardCanvas
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

  boardCanvas
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

  //Draw grid rects
  boardCanvas
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

  //Draw pieces
  let dragEndedDimensions = function(d) {
    node = d3.select(this);
    dragEnded(origin, gridWidth, node, d);
  };

  let drag = d3
    .drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEndedDimensions);

  boardCanvas
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

  //Draw scoreboard
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
    boardCanvas.selectAll("rect:nth-child(" + i + ")").style("fill", "black");

    if (i % 8 == 7) {
      i += 3;
    } else if (i % 8 == 0) {
      i += 1;
    } else {
      i += 2;
    }
  }

  return boardState;
}

function showColor() {
  boardCanvas.selectAll("circle").style("fill", function(d) {
    if (d.state == red || d.state == redKing) return "#e8232a";
    else if (d.state == black || d.state == blackKing) return "#383838";
  });
}

function showImage() {
  boardCanvas.selectAll("circle").style("fill", function(d) {
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
  } else if (winner === computer) {
    winnerLabel = "You Lost!";
  }

  if (winner != 0) {
    d3.select("#btnReplay").style("display", "inline");
  }

  addLog(winnerLabel);
}

function integ(num) {
  if (num != null) return Math.round(num);
  else return null;
}

function abs(num) {
  return Math.abs(num);
}

function sign(num) {
  if (num < 0) return -1;
  else return 1;
}

/*function drawText(data) {
  boardCanvas
    .append("g")
    .selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("x", function(d) {
      let x = mapgridToCoordinates(boardOriginPos, gridSize, d).x;
      return x + gridSize / 2;
    })
    .attr("y", function(d) {
      let y = mapgridToCoordinates(boardOriginPos, gridSize, d).y;
      return y + gridSize / 2;
    })
    .style("fill", function(d) {
      if (d.state === red) return "black";
      else return "white";
    })
    .text(function(d) {
      /*if (d.state === red) return "R"; 
									else if (d.state === black) return "B"; 
									else if (
        d.state === redKing ||
        d.state === blackKing
      )
        return "K";
      else return "";
    });
}*/

function showBoardState() {
  d3.selectAll("text").each(function(d, i) {
    d3.select(this).style("display", "none");
  });

  let grids = activeBoard.grids;
  let pieces = activeBoard.pieces;
  //drawText(grids);
  //drawText(pieces);
}

/* COMPUTER AI FUNCTIONS */
function copy_board(board) {
  let newBoard = {};
  newBoard.ui = false;
  let grids = new Array();
  let pieces = new Array();

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

function get_player_pieces(player, target_board) {
  player_pieces = new Array();
  for (let i = 0; i < target_board.pieces.length; i++) {
    let piece = target_board.pieces[i];
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

function get_grid_index(target_board, col, row) {
  let index = -1;
  for (let i = 0; i < target_board.grids.length; i++) {
    let grid = target_board.grids[i];
    if (grid.col === col && grid.row === row) {
      index = i;
      break;
    }
  }
  return index;
}

function get_available_piece_moves(target_board, target_piece, player) {
  let moves = [];
  let from = target_piece;

  // check for slides
  let x = [-1, 1];
  x.forEach(function(entry) {
    let grid_index = get_grid_index(
      target_board,
      from.col + entry,
      from.row + player * 1
    );
    if (grid_index >= 0) {
      let to = target_board.grids[grid_index];
      if (
        isMoveLegal(target_board.grids, target_board.pieces, from, from, to)
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

  // check for jumps
  x = [-2, 2];
  x.forEach(function(entry) {
    let grid_index = get_grid_index(
      target_board,
      from.col + entry,
      from.row + player * 2
    );
    if (grid_index >= 0) {
      let to = target_board.grids[grid_index];
      if (
        isMoveLegal(target_board.grids, target_board.pieces, from, from, to)
      ) {
        move = {
          move_type: "jump",
          piece: player,
          from: { col: from.col, row: from.row },
          to: { col: to.col, row: to.row }
        };
        moves[moves.length] = move;
      }
    }
  });

  // kings
  if (Math.abs(from.state) === 1.1) {
    // check for slides
    let x = [-1, 1];
    let y = [-1, 1];
    x.forEach(function(xmove) {
      y.forEach(function(ymove) {
        let grid_index = get_grid_index(
          target_board,
          from.col + xmove,
          from.row + ymove
        );
        if (grid_index >= 0) {
          let to = target_board.grids[grid_index];
          if (
            isMoveLegal(target_board.grids, target_board.pieces, from, from, to)
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

    // check for jumps
    x = [-2, 2];
    y = [-2, 2];
    x.forEach(function(xmove) {
      y.forEach(function(ymove) {
        let grid_index = get_grid_index(
          target_board,
          from.col + xmove,
          from.row + ymove
        );
        if (grid_index >= 0) {
          let to = target_board.grids[grid_index];
          if (
            isMoveLegal(target_board.grids, target_board.pieces, from, from, to)
          ) {
            move = {
              move_type: "jump",
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

function get_available_moves(player, target_board) {
  let moves = [];
  let move = null;
  let player_pieces = get_player_pieces(player, target_board);

  for (let i = 0; i < player_pieces.length; i++) {
    let from = player_pieces[i];
    let piece_moves = get_available_piece_moves(target_board, from, player);
    moves.push.apply(moves, piece_moves);
  }

  //prune non-jumps, if applicable
  let jump_moves = [];
  for (let i = 0; i < moves.length; i++) {
    let move = moves[i];
    if (move.move_type == "jump") {
      jump_moves.push(move);
    }
  }
  if (jump_moves.length > 0) {
    moves = jump_moves;
  }
  //debugger;
  return moves;
}

function select_random_move(moves) {
  // Randomly select move
  let index = Math.floor(Math.random() * (moves.length - 1));
  let selected_move = moves[index];

  return selected_move;
}

function setDepth() {
  value = document.getElementById("depth_value").value;
  maxDepth = value;
}

function alpha_beta_search(calc_board, limit) {
  let alpha = Number.NEGATIVE_INFINITY;
  let beta = Infinity;

  //get available moves for computer
  let available_moves = get_available_moves(computer, calc_board);

  //get max value for each available move
  let max = max_value(calc_board, available_moves, limit, alpha, beta);

  //find all moves that have max-value
  let best_moves = [];
  let max_move = null;
  for (let i = 0; i < available_moves.length; i++) {
    let next_move = available_moves[i];
    if (next_move.score == max) {
      max_move = next_move;
      best_moves.push(next_move);
    }
  }

  //randomize selection, if multiple moves have same max-value
  if (best_moves.length > 1) {
    max_move = select_random_move(best_moves);
  }

  return max_move;
}

function computerMove() {
  // Copy board into simulated board
  let simulated_board = copy_board(activeBoard);

  // Run algorithm to select next move
  let selected_move = alpha_beta_search(simulated_board, maxDepth);
  console.log(
    "best move: " +
      selected_move.from.col +
      ":" +
      selected_move.from.row +
      " to " +
      selected_move.to.col +
      ":" +
      selected_move.to.row
  );

  // Make computer's move
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
  showBoardState();

  let winner = getWinner(activeBoard);
  if (winner != 0) {
    activeBoard.gameOver = true;
  } else {
    // Set turn back to human
    activeBoard.turn = player;
    activeBoard.delay = 0;
  }
}

function jump_available(available_moves) {
  let jump = false;
  for (let i = 0; i < available_moves.length; i++) {
    let move = available_moves[i];
    if (move.move_type == "jump") {
      jump = true;
      break;
    }
  }

  return jump;
}

function min_value(calc_board, human_moves, limit, alpha, beta) {
  if (limit <= 0 && !jump_available(human_moves)) {
    return utility(calc_board);
  }
  let min = Infinity;

  //for each move, get min
  if (human_moves.length > 0) {
    for (let i = 0; i < human_moves.length; i++) {
      simulated_board = copy_board(calc_board);

      //move human piece
      let human_move = human_moves[i];
      let pieceIndex = getPieceIndex(
        simulated_board.pieces,
        human_move.from.row,
        human_move.from.col
      );
      let piece = simulated_board.pieces[pieceIndex];
      simulated_board = movePiece(
        simulated_board,
        piece,
        human_move.from,
        human_move.to
      );

      //get available moves for computer
      let computer_moves = get_available_moves(computer, simulated_board);

      //get max value for this move
      let max_score = max_value(
        simulated_board,
        computer_moves,
        limit - 1,
        alpha,
        beta
      );

      //compare to min and update, if necessary
      if (max_score < min) {
        min = max_score;
      }
      human_moves[i].score = min;
      if (min <= alpha) {
        break;
      }
      if (min < beta) {
        beta = min;
      }
    }
  } else {
    //log("NO MORE MOVES FOR MIN: l=" + limit);
  }

  return min;
}

function max_value(calc_board, computer_moves, limit, alpha, beta) {
  if (limit <= 0 && !jump_available(computer_moves)) {
    return utility(calc_board);
  }
  let max = Number.NEGATIVE_INFINITY;

  //for each move, get max
  if (computer_moves.length > 0) {
    for (let i = 0; i < computer_moves.length; i++) {
      simulated_board = copy_board(calc_board);

      //move computer piece
      let computer_move = computer_moves[i];
      let pieceIndex = getPieceIndex(
        simulated_board.pieces,
        computer_move.from.row,
        computer_move.from.col
      );
      let piece = simulated_board.pieces[pieceIndex];
      simulated_board = movePiece(
        simulated_board,
        piece,
        computer_move.from,
        computer_move.to
      );

      //get available moves for human
      let human_moves = get_available_moves(player, simulated_board);

      //get min value for this move
      let min_score = min_value(
        simulated_board,
        human_moves,
        limit - 1,
        alpha,
        beta
      );
      computer_moves[i].score = min_score;

      //compare to min and update, if necessary
      if (min_score > max) {
        max = min_score;
      }
      if (max >= beta) {
        break;
      }
      if (max > alpha) {
        alpha = max;
      }
    }
  } else {
    //log("NO MORE MOVES FOR MAX: l=" + limit);
  }

  return max;
}

function evaluate_position(x, y) {
  if (x == 0 || x == 7 || y == 0 || y == 7) {
    return 5;
  } else {
    return 3;
  }
}

function utility(target_board) {
  let sum = 0;
  let computer_pieces = 0;
  let computer_kings = 0;
  let human_pieces = 0;
  let human_kings = 0;
  let computer_pos_sum = 0;
  let human_pos_sum = 0;

  //log("************* UTILITY *****************")
  for (let i = 0; i < target_board.pieces.length; i++) {
    let piece = target_board.pieces[i];
    if (piece.row > -1) {
      // only count pieces still on the board
      if (piece.state > 0) {
        // human
        human_pieces += 1;
        if (piece.state === 1.1) {
          human_kings += 1;
        }
        let human_pos = evaluate_position(piece.col, piece.row);
        human_pos_sum += human_pos;
      } else {
        // computer
        computer_pieces += 1;
        if (piece.state === -1.1) {
          computer_kings += 1;
        }
        let computer_pos = evaluate_position(piece.col, piece.row);
        computer_pos_sum += computer_pos;
      }
    }
  }

  let piece_difference = computer_pieces - human_pieces;
  let king_difference = computer_kings - human_kings;
  if (human_pieces === 0) {
    human_pieces = 0.00001;
  }
  let avg_human_pos = human_pos_sum / human_pieces;
  if (computer_pieces === 0) {
    computer_pieces = 0.00001;
  }
  let avg_computer_pos = computer_pos_sum / computer_pieces;
  let avg_pos_diff = avg_computer_pos - avg_human_pos;

  let features = [piece_difference, king_difference, avg_pos_diff];
  let weights = [100, 10, 1];

  let board_utility = 0;

  for (let f = 0; f < features.length; f++) {
    let fw = features[f] * weights[f];
    board_utility += fw;
  }

  //log("utility=" + board_utility);
  //log("************* END  UTILITY ************")

  return board_utility;
}
