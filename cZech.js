/************************************************************************************************/
/*  Author:  Jimmy Styles                                                                       */
/*  Support: Bludoid                                                                            */
/*  Date:    Sept 22/24 - Nov 30/24                                                             */
/*                                                                                              */
/*  Audio:   https://pixabay.com/sound-effects/error-126627/                                    */
/*           https://pixabay.com/sound-effects/knocking-on-the-board-158172/                    */
/*           https://pixabay.com/sound-effects/success-fanfare-trumpets-6185/                   */
/*           https://pixabay.com/sound-effects/goodresult-82807/                                */
/*           https://pixabay.com/sound-effects/low-no-82600/                                    */
/*                                                                                              */
/*  Images:  https://commons.wikimedia.org/wiki/Category:PNG_chess_pieces/Standard_transparent  */
/*           https://fonts.google.com/icons?selected=Material+Symbols+Outlined:chevron_backward */
/*           https://fonts.google.com/icons?selected=Material+Symbols+Outlined:chevron_forward  */
/*           https://fonts.google.com/icons?selected=Material+Symbols+Outlined:first_page       */
/*           https://fonts.google.com/icons?selected=Material+Symbols+Outlined:last_page        */
/*                                                                                              */
/************************************************************************************************/

let squareArr = [true,
    'br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br',
    'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp',
    'wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr' ];
let newBoard= [...squareArr];   //not used
squareArr[0]=[...squareArr];

function Lionel() { console.log("Hello! Is it me you're looking for?"); }
function getId(ele) { return document.getElementById(ele); }
function setWidth(pxls) { r.style.setProperty('--sqWidth', pxls) }       // changes CSS variable in :root 
function setColumns(c) { r.style.setProperty('--columns', c) }          // changes CSS variable in :root
function rank(num) { return 9 - (Math.ceil(num / 8)); }
function file(num) { return num % 8 ? num % 8 : 8; }
function getId(ele) { return document.getElementById(ele); }
function bgColour(ele, colour) { ele.style = (colour == "white") ? "background:#ddd" : "background:grey"; }

let currentPlayer = () => getId('board').dataset.player.charAt(0);
let changePlayer = () => getId('board').dataset.player = currentPlayer() == 'w' ? 'black' : 'white';
let opponent = () => currentPlayer() == 'w' ? 'b' : 'w';
let playerAt = (where) => squareArr[where].charAt(0);
let pieceAt = (where) => squareArr[where].charAt(1);
let mate = false;

const moves = [];
const columns = 8;
const wPassant = { 'where': 0, 'move': 0, 'passant': false };
const bPassant = { 'where': 0, 'move': 0, 'passant': false };
const promote = { from: 0, to: 0 };
const r = document.querySelector(':root');
const rs = getComputedStyle(r);

const castle = {    // properties with numeric keys represent rook and king squares, values represent whether they have ever moved
    1: false, 57: false,
    5: false, 61: false,
    8: false, 64: false,

    isRook(square) { return Object.hasOwn(this, square); },
    hasPieceMoved(square) { return this[square]; },
    recordMove(square) { this[square] = true; },
};

function printBoard(cols) {
    // build board element with 64 child square elements
    // initialize player and round in board element
    // declare a 'click event' for each square element
    let i = 1;
    let row = 1;
    const board = getId("board");

    board.innerHTML = "";
    board.setAttribute('data-player', 'white');
    while (i <= cols ** 2) {
        const square = document.createElement("div");
        square.classList = "square";
        square.id = i;
        if (row % 2) {  // odd ranks start white then black
            if (i % 2) { bgColour(square, "white"); }
            else { bgColour(square, "black"); }
        }
        else {       // even ranks start black then white
            if (i % 2) { bgColour(square, "black"); }
            else { bgColour(square, "white"); }
        }

        square.addEventListener("click", clickEvent)
        board.appendChild(square);

        if (!(i % cols)) {       // increment row and add break between ranks
            row++;
            board.appendChild(document.createElement("br"));
        }
        i++;  // next square
    }
    
    for (let i = 1; i <= squareArr.length - 1; i++)  printSquare(i, squareArr[i]); 
    printPromote('w');
    printPromote('b');
    setMousePointer(getId("board").dataset.player);
    moves.push({piece:'',notation:'', board: [...squareArr]});
}

//   fill divs above and below board with promotion pieces, then hide them
function printPromote(colour) {

    const promote = ['n', 'b', 'r', 'q'];                // add colour parameter to each element makes a valid piece
    const bg = colour == 'w' ? 'black' : 'white';
    const parent = colour == 'w' ? 'wPromote' : 'bPromote';  // ids for divs above and below the board

    for (let i = 0; i < promote.length; i++) {
        const square = document.createElement('div');
        const piece = colour + promote[i];               // form a valid piece for printSquare()

        square.classList = 'promotion';                  // using 'square' will interfere with querySelector(square) elsewhere
        square.id = piece;
        bgColour(square, bg);
        square.addEventListener('click', promotePawn);  // action taken for promotion choice
        getId(parent).appendChild(square);
        printSquare(square.id, square.id, parent)       // modify printSquare to receive 3rd parameter
    }
    getId('wPromote').style.visibility = 'hidden';
    getId('bPromote').style.visibility = 'hidden';
}

function promotePawn() {

    const squares = document.querySelectorAll('.square');
    squares.forEach(square => square.classList.remove('disabled'));     // enable board appearance back to original
    squareArr[promote.from] = this.id;                                  // change pawn to promotion piece before moving
    getId('wPromote').style.visibility = 'hidden';
    getId('bPromote').style.visibility = 'hidden';
    move(promote.from, promote.to, this.id);                            // call move with promotion piece (this.id)
}

// num= element id   // piece= image file  // set ele just for promotion otherwise empty
function printSquare(num, piece, ele) {

    // remove element attributes, classes and innerHTML before reassigning them to squares containing a piece
    delete getId(num).dataset.pieceColour;
    delete getId(num).dataset.pieceType;
    getId(num).classList.remove("clicked");     // printing squares implies a square is no longer selected
    getId(num).innerHTML = "";

    if (piece == "") {
        squareArr[num] = "";
        return;
    }

    // add image to squares containing a piece
    const pieceImg = document.createElement("img");
    pieceImg.src = "assets/images/" + piece + ".png";
    getId(num).appendChild(pieceImg);

    // add attributes to square and update array of squares     // formatting not necessary?????????? just store a single character
    const colour = formatColour(piece.charAt(0));
    const type = formatType(piece.charAt(1));
    getId(num).dataset.pieceColour = colour;
    getId(num).dataset.pieceType = type;
    if (ele === undefined) { squareArr[num] = piece; }                // ele will be undefined for board squares, but defined for promotion squares
}

function printMove(){
    
    const moveNo = document.createElement("div");
    const moveContainer = document.createElement("div");
    const moveImg = document.createElement("img");
    const moveNotation = document.createElement("div");
 
    moveNo.classList= "moveNo";
    moveNo.innerHTML= Math.ceil(moves.length /2);           // moves[0] is starter position, so moves[3] completes round 1
    moveNotation.innerHTML= moves[moves.length-1].notation; // notation property from last element of move array
    moveImg.classList="moveImg";
    moveImg.src = "assets/images/" + moves[moves.length-1].piece + ".png";

    moveContainer.classList= "moveContainer"; 
    moveContainer.appendChild(moveImg);         // add image first
    moveContainer.appendChild(moveNotation);    // then add notation to the move container

    if((moves.length+1)%2) getId('moveHistory').appendChild(moveNo);    // add line number first
    getId('moveHistory').appendChild(moveContainer);                    // then add the move container to the move history container
    getId('moveHistory').scrollTop = getId('moveHistory').scrollHeight; // move scroll bar to show the latest additions (the appends above)
}


function clickEvent() {

    let found = 0;      // use as value and boolean
    let ValidMoves = [];
    const currentPlayer = getId('board').dataset.player.charAt(0);
    const thisClick = playerAt(this.id);

    let squares = document.querySelectorAll(".square");
    for (let i = 0; i < squares.length; i++) {
        if (squares[i].classList.contains("clicked")) { found = i + 1; }
    }
    // if(!found && currentPlayer==thisClick) {validMoves=validMove(Number(this.id));}

    if ((thisClick != currentPlayer))
        if (!found)     // your first click and not your own piece
        { return; }
        else {           // your second click and not your own piece
            move(found, Number(this.id), squareArr[found]);
            return;
        }

    if (!found || this.id == found)              // either first click OR second click is same as first
        { this.classList.toggle("clicked"); }
    if (found && this.id != found) {              // your second click is your own piece... therefore selection change
        getId(found).classList.toggle("clicked");
        this.classList.toggle("clicked");
    }
}

function move(from, to, piece) {

    let valid;
    if (promote.from) {       // skip move validation if we are promoting
        promote.from = 0;
        promote.to = 0;
        valid = true;         // promotion piece from penultimate rank could defy validation, eg.. pawn pushes forward and promotes to bishop
    }
    else { valid = validMove(from, to, piece); }  // no promotion, run validation process

    if (!valid) {
        soundAlert('invalid');
        return;
    }

    // check from pawn promoting
    if (pieceAt(from) == 'p' && (rank(to) == 8 || rank(to) == 1)) {
        getId(playerAt(from) + 'Promote').style.visibility = 'visible';      // make promotion pieces visible
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => square.classList.add('disabled'));        // provide a disabled look to board during promotion selection
        promote.from = from;     //record source and target squares for the promotePawn EVENTLISTENER
        promote.to = to;
        return;
    }

    // if(pieceAt(to)=='r' && !castle.hasPieceMoved(to)) castle.recordMove(to);
    printSquare(from, "");
    printSquare(to, piece);

    // passant requires explicit removal of defender, unlike every other attack
    if (getId('board').dataset.player == 'black') {
        if (bPassant.move == moves.length - 1 && bPassant.passant && to== wPassant.where +8 && pieceAt(to)== 'p') {      // is black passant current
            printSquare(bPassant.where, "");
            bPassant.passant = false;
            // bPassant.where = 0; bPassant.move = 0; bPassant.passant = false;
        }
    }
    // passant requires explicit removal of defender, unlike every other attack
    if (getId('board').dataset.player == 'white') {
        if (wPassant.move == moves.length - 1 && wPassant.passant && to== wPassant.where -8 && pieceAt(to)== 'p' ) {      // is white passant current
            printSquare(wPassant.where, "");
            wPassant.passant = false;
            // wPassant.where = 0; wPassant.move = 0; wPassant.passant = false;
        }
    }

    if (piece.charAt(1) == 'k' && Math.abs(from - to) == 2) {   // has the king Castled
        if (piece.charAt(0) == 'w') {
            if (to == 59) {                                     // long castle white
                printSquare(57, '');
                printSquare(60, 'wr');
            }
            if (to == 63) {                                     // short castle white
                printSquare(64, '');
                printSquare(62, 'wr');
            }
        } else {
            if (to == 3) {                                      // long castle black
                printSquare(1, '');
                printSquare(4, 'br');
            }
            if (to == 7) {                                      // short castle black
                printSquare(8, '');
                printSquare(6, 'br');
            }
        }
    }

    soundAlert('valid');
    console.log("white Passant", wPassant.move, moves.length-1, );

    if(moves.length >20 && !mate){
        isStaleMate(to);
        isDraw();
    }     

    moves.push({ piece: piece, notation: formatFile(file(to)) +rank(to), board: [...squareArr] });     // record moves, especially for passant sake
    printMove();
    getId('moveHistory').dataset.navIndex= moves.length -1;

    changePlayer();
    setMousePointer(getId('board').dataset.player);
}

function isStaleMate(to){
    
    let pieces= [];
    const squares= document.querySelectorAll('.square');
    const kingAt= squareArr.indexOf(opponent() +'k');
    const canMove= canKingMove(kingAt, false);
    const staleMateMsg= `${formatColour(opponent())} King has no where to go... That's a stalemate!` 
    
    if(canMove) return false;
    squares.forEach( ele =>  { if(playerAt(ele.id)== opponent()) pieces.push(Number(ele.id)); });

    if(pieces.length == 1 && !canMove) { gameOver(staleMateMsg, 'staleMate'); }    
    if(pieces.length >1 && !canMove){
        for(const piece of pieces){
            if(pieceAt(piece)== 'k') continue;
            if(canPieceMove(piece, opponent())) return false;
        }
        if(pieceAt(to)=='p' && canEnPassant(to, currentPlayer()) ) return;
        gameOver(staleMateMsg, 'staleMate');
    }    
}

function isDraw(){
    
    let currentPieces= [];
    let opponentPieces= [];
    const squares= document.querySelectorAll('.square');

    squares.forEach( ele =>  {
        if(playerAt(ele.id)== currentPlayer()) currentPieces.push(Number(ele.id));
        if(playerAt(ele.id)== opponent()) opponentPieces.push(Number(ele.id));
    });

    if(currentPieces.length== 1 && opponentPieces.length== 1) gameOver('Insufficient Material... King vs. King', 'staleMate');
    if(currentPieces.length==1 && opponentPieces.length==2){
        if(opponentPieces.some( (piece) => pieceAt(piece)=='b')) gameOver('Insufficient Material... King and Bishop vs. King', 'staleMate');
        if(opponentPieces.some( (piece) => pieceAt(piece)=='n')) gameOver('Insufficient Material... King and Knight vs. King', 'staleMate');
    }    
    if(opponentPieces.length==1 && currentPieces.length==2){
        if(currentPieces.some( (piece) => pieceAt(piece)=='b')) gameOver('Insufficient Material... King and Bishop vs. King', 'staleMate');
        if(currentPieces.some( (piece) => pieceAt(piece)=='n')) gameOver('Insufficient Material... King and Knight vs. King', 'staleMate');
    }    
    let comparePiece;
    if(opponentPieces.length==2 && currentPieces.length==2){
        for(let piece of opponentPieces) if(pieceAt(piece) != 'k') comparePiece= getId(piece).style.background;
        for(let piece of currentPieces){
             if(pieceAt(piece) != 'k'){
                if(getId(piece).style.background== comparePiece) gameOver('Insufficient Material... King and Bishop vs. King and same Bishop', 'staleMate');
            }    
        }
    }                     
}

function formatColour(colour) {
    const colours = { 'w': 'white', 'b': 'black' };
    return colours[colour] || '';
}

function formatType(type) {
    const types = {
        'p': 'pawn',
        'r': 'rook',
        'n': 'knight',
        'b': 'bishop',
        'q': 'Queen',
        'k': 'King'
    };
    return types[type] || '';
}

function formatFile(file) {
    const files = {
        '1': 'a',
        '2': 'b',
        '3': 'c',
        '4': 'd',
        '5': 'e',
        '6': 'f',
        '7': 'g',
        '8': 'h'
    };
    return files[file] || '';
}

function setMousePointer(colour) {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.addEventListener('mouseenter', () => {
            if (square.getAttribute('data-piece-colour') == colour) { square.classList.add('current-player-pointer'); }
            else { square.classList.remove('current-player-pointer'); }
        });
        square.addEventListener('mouseleave', () => {
            square.classList.remove('current-player-pointer');
        });
    });
}

function soundAlert(soundType) {

    switch (soundType) {
        case 'invalid':
            const invalidMoveSound = new Audio('assets/sounds/invalidMove.mp3');
            invalidMoveSound.volume = 0.4;
            invalidMoveSound.currentTime = 0.500;
            invalidMoveSound.play();
            console.log("Not a valid move");
            break;

        case 'valid':
            const validMoveSound = new Audio('assets/sounds/validMove.mp3');
            validMoveSound.volume = 0.3;
            validMoveSound.play();
            break;

        case 'check':
            const checkSound = new Audio('assets/sounds/check.mp3');
            checkSound.volume = 0.3;
            checkSound.play();
            break;

        case 'staleMate':
            const staleMateSound = new Audio('assets/sounds/staleMate.mp3');
            staleMateSound.volume = 0.5;
            staleMateSound.play();
            break;
    

        case 'checkMate':
            const checkMateSound = new Audio('assets/sounds/checkMate.mp3');
            checkMateSound.volume = 0.5;
            checkMateSound.play();
            break;

        default: break;
    }
}

function validPawn(from, to) {

    let valid = false;
    
    if(to < 1 || to > 64) return false;
    if (playerAt(from) == 'w') {

        if ((from - to == 7 && from % 8 != 0 && playerAt(to) == 'b') ||    // white attacks black NorthWest or NorthEast
            (from - to == 9 && from % 8 != 1 && playerAt(to) == 'b')) { valid = true; }
        if (from - to == 8 && playerAt(to) == '')                       // white pushes one
        { valid = true; }
        if (from - to == 16 && playerAt(to) == '' && playerAt(from - 8) == '' && rank(from) == 2) {   // white pushes two
            valid = true;
            if ((playerAt(to - 1) == 'b' && from % 8 != 1) ||         // is en passant possible having pushed two
                (playerAt(to + 1) == 'b' && from % 8 != 0)) {
                bPassant.where = to;
                bPassant.move = moves.length;
                bPassant.passant = false;
            }
        }
        if ((from - to == 7 && from % 8 != 0 && rank(from) == 5                        // white wants en passant to the right
            && wPassant.where == from + 1 && wPassant.move == moves.length - 1)) {      // and black made it possible last move 
                valid = true;
                wPassant.passant = true;
        }
        if ((from - to == 9 && from % 8 != 1 && rank(from) == 5                        // white wants en passant to the left
            && wPassant.where == from - 1 && wPassant.move == moves.length - 1)) {      // and black made it possible last move 
                valid = true;
                wPassant.passant = true;
        }
    }
    else {
        if ((from - to == -7 && from % 8 != 1 && playerAt(to) == 'w') ||   // black attacks white left or right
            (from - to == -9 && from % 8 != 0 && playerAt(to) == 'w')) { valid = true; }
        if (from - to == -8 && playerAt(to) == '')                      // black pushes one
        { valid = true; }
        if (from - to == -16 && playerAt(to) == '' && playerAt(from + 8) == '' && rank(from) == 7) {      // white pushes two
            valid = true;
            if ((playerAt(to - 1) == 'w' && from % 8 != 1) ||         // is en passant possible having pushed two
                (playerAt(to + 1) == 'w' && from % 8 != 0)) {
                wPassant.where = to;
                wPassant.move = moves.length;
                wPassant.passant = false;
            }
        }
        if ((from - to == -7 && from % 8 != 1 && rank(from) == 4                   // black wants en passant to the left
            && bPassant.where == from - 1 && bPassant.move == moves.length - 1)) {  // and white made it possible last move
                valid = true;
                bPassant.passant = true;
        }
        if ((from - to == -9 && from % 8 != 0 && rank(from) == 4                   // black wants en passant to the right
            && bPassant.where == from + 1 && bPassant.move == moves.length - 1)) {  // and white made it possible last move
                valid = true;
                bPassant.passant = true;
        }
    }
    return valid;
}

function validRook(from, to) {        // probably don't need to check if to is empty

    if(to < 1 || to > 64) return false;
    if (file(from) == file(to)) {                                  // moving North or South
        if (from > to) {
            for (let path = from - 8; path >= to + 8; path -= 8) {        // scan North between from and to
                if (pieceAt(path) != '') { return false; }
            }
            if ((pieceAt(to) == '') || (playerAt(from) != playerAt(to))) { return true; }     // is target empty or occupied by opponent
            else { return false; }
        }
        else {
            for (let path = from + 8; path <= to - 8; path += 8) {        // scan South between from and to
                if (pieceAt(path) != '') { return false; }
            }
            if ((pieceAt(to) == '') || (playerAt(from) != playerAt(to))) { return true; }     // is target empty or occupied by opponent
            else { return false; }
        }
    }

    if (rank(from) == rank(to)) {                                  // moving East or West
        if (from > to) {
            for (let path = from - 1; path >= to + 1; path--) {         // scan West between from and to
                if (pieceAt(path) != '') { return false; }
            }
            if ((pieceAt(to) == '') || (playerAt(from) != playerAt(to))) { return true; }     // is target empty or occupied by opponent 
            else { return false; }
        }
        else {
            for (let path = from + 1; path <= to - 1; path++) {         // scan East between from and to
                if (pieceAt(path) != '') { return false; }
            }
            if ((pieceAt(to) == '') || (playerAt(from) != playerAt(to))) { return true; }     // is target empty or occupied by opponent
            else { return false; }
        }
    }
    return false;
}

function validBishop(from, to) {      // probably don't need to check if to is empty

    if(to < 1 || to > 64) return false;
    if (from % 9 == to % 9) {                                       // moving NorthWest or SouthEast
        if (from > to && file(from) != 1) {
            for (let path = from - 9; path >= to + 9; path -= 9) {       // scan NorthWest between from and to
                if (pieceAt(path) != '') return false;
                if (file(path) == 1 && path != to) { return false; } // border reached, stop scanning
            }
            if (pieceAt(to) == '' || playerAt(from) != playerAt(to)) { return true; }    // is target empty or occupied by opponent
        }
        if (from < to && file(from) != 8) {
            for (let path = from + 9; path <= to - 9; path += 9) {       // scan SouthEast between from and to
                if (pieceAt(path) != '') { return false; }
                if (file(path) == 8 && path != to) { return false; } // border reached, stop scanning
            }
            if (pieceAt(to) == '' || playerAt(from) != playerAt(to)) { return true; }    // is target empty or occupied by opponent
        }
    }

    if (from % 7 == to % 7) {                                       // moving NorthEast or SouthWest
        if (from > to && file(from) != 8) {
            for (let path = from - 7; path >= to + 7; path -= 7) {       // scan NorthEast between from and to
                if (pieceAt(path) != '') { return false; }
                if (file(path) == 8 && path != to) { return false; } // border reached, stop scanning
            }
            if (pieceAt(to) == '' || playerAt(from) != playerAt(to)) { return true; }    // is target empty or occupied by opponent
        }
        if (from < to && file(from) != 1) {
            for (let path = from + 7; path <= to - 7; path += 7) {       // scan SouthWest between from and to
                if (pieceAt(path) != '') { return false; }
                if (file(path) == 1 && path != to) { return false; } // border reached, stop scanning
            }
            if (pieceAt(to) == '' || playerAt(from) != playerAt(to)) { return true; }    // is target empty or occupied by opponent
        }
    }
    return false;
}

function validKnight(from, to) {

    const target = Math.abs(from - to);      // scan target squares only,  6,-6, 10,-10, 15,-15, 17,-17
    
    if(to < 1 || to > 64) return false;
    switch (target) {                       // knight hops, no actual path
        case 6:
        case 10:
        case 15:
        case 17:
            if (getId(from).style.background == getId(to).style.background) { return false; } // knight moves to opposite square colour only
            if (pieceAt(to) == '' || playerAt(from) != playerAt(to)) { return true; }         // is target empty or occupied by opponent
            break;
        default: return false;
    }
}

function validQueen(from, to) {       // Queen mimics bishop and rook validation
    
    if (validBishop(from, to) || validRook(from, to)) { return true; }
    return false;
}

function validKing(from, to) {

    // DELETE OPPONENTCOLOUR CONST AND SUBSTITURE WITH opponent()

    let kingInterference = false;
    const path = Math.abs(from - to);
    const opponentColour = playerAt(from) == 'w' ? 'b' : 'w';
    const target = [1, -1, 7, -7, 8, -8, 9, -9]; // scan targets only, no actual path

    if (to < 1 || to > 64) return false;   // canKingMove could position King off the board
    switch (path) {
        case 1:
        case 7:
        case 8:
        case 9: if (pieceAt(to) == '' || playerAt(from) != playerAt(to)) {     // is target empty or occupied by opponent
            for (let path of target) {
                if (to + path >= 1 && to + path <= 64) {                    // prevent breach of North and South border
                    if (Math.abs(file(from) - file(to)) > 1) return false;
                    if (Math.abs(file(to + path) - file(from)) < 3) {    // breach border East or West creates file gap greater than 2
                        if (squareArr[to + path] == opponentColour + 'k') return false;     // adjacent Kings not allowed 
                    }
                }
            }
            return true;
        }
            break;

        //Castling
        case 2: const cloneSquareArr = [...squareArr];   // clone array for isInCheck function
            if ((from == 5 && !castle.hasPieceMoved(5)) || (from == 61) && !castle.hasPieceMoved(61)) {  // King and rook have not moved
                if (from - to > 0) {     // long castle
                    if (!castle.hasPieceMoved(from - 4)) {      // long Rook has not moved
                        // rare case when opponent King encroaches King square after castle
                        if (cloneSquareArr[from - 4].charAt(1) != 'r') return false;
                        if (currentPlayer() == 'w') { [50, 51].forEach((index) => { if (cloneSquareArr[index] == 'bk') kingInterference = true; }) }
                        if (currentPlayer() == 'b') { [10, 11].forEach((index) => { if (cloneSquareArr[index] == 'wk') kingInterference = true; }) }

                        for (let i = 0; i < 3; i++) {             // check vacancy for 3 squares
                            if ((cloneSquareArr[from - i] != '' && i != 0)     // squares between king and rook not empty (except king square)
                                || isInCheck(from - i, opponent()).length) {  // OR squares under attack
                                return false;       // failed condition above
                            }
                        }
                    } else { return false; }   // long rook already moved 

                } else {      // short castle
                    if (!castle.hasPieceMoved(from + 3)) {      // short Rook has not moved         
                        // rare case when opponent King encroaches King square after castle// only square 55 and 15 needs checking
                        if (cloneSquareArr[from + 3].charAt(1) != 'r') return false;
                        if (currentPlayer() == 'w') { [55, 56].forEach((index) => { if (cloneSquareArr[index] == 'bk') kingInterference = true; }) }
                        if (currentPlayer() == 'b') { [15, 16].forEach((index) => { if (cloneSquareArr[index] == 'wk') kingInterference = true; }) }

                        for (let i = 0; i < 3; i++) {             // check vacancy for 3 squares
                            if ((cloneSquareArr[from + i] != '' && i != 0)     // squares between king and rook not empty (except king square)
                                || isInCheck(from + i, opponent()).length) {  // OR squares under attack
                                return false;       // failed condition above
                            }
                        }
                    } else { return false; }   // short rook already moved 
                }
                if (kingInterference) {   // if opponent king interfers with castling, DENY CASTLE
                    soundAlert('inValid');
                    console.log(`opponent king at ${currentPlayer() == 'w' ? cloneSquareArr.indexOf('bk') : cloneSquareArr.indexOf('wk')} interfers with castling`);
                    return false;
                }
                return true;        // castle range was vacant and free of attack - KING CASTLES
            } else { return false; }    // King and Rook moved from starter square -KING CANT CASTLE

        default: return false;
    }
}

function validMove(from, to, piece) {

    let rtnVal;
    switch (pieceAt(from)) {
        case 'p': rtnVal = validPawn(from, to); break;
        case 'r': rtnVal = validRook(from, to); break;
        case 'k': rtnVal = validKing(from, to); break;
        case 'q': rtnVal = validQueen(from, to); break;
        case 'b': rtnVal = validBishop(from, to); break;
        case 'n': rtnVal = validKnight(from, to); break;
        default: console.log('ValidateMove() found unknown piece'); break;
    }
    if (!rtnVal) return false;

    /// WHAT ABOUT PROMOTION SIMULATION ?????????????
    let copySquareArr = JSON.parse(JSON.stringify(squareArr));
    squareArr[from] = '';
    squareArr[to] = piece;
    if( (wPassant.passant && wPassant.move== moves.length-1 && wPassant.where== to+8 && pieceAt(to)== 'p') 
        || (bPassant.passant && bPassant.move==moves.length-1 && bPassant.where== to-8 && pieceAt(to)== 'p') ){
            if(currentPlayer()=='w') {squareArr[to+8] = '';}
            else {squareArr[to-8] = '';}
    }

    const currentPlayerKing = squareArr.indexOf(currentPlayer() + 'k');
    const opponentKing = squareArr.indexOf(opponent() + 'k');

    // SELF CHECK- verify that our valid move does not produce self-check
    if(isInCheck(currentPlayerKing, opponent()).length){
        console.log("You can not place your king in peril");
        squareArr = copySquareArr;
        return false;
    }     
    if(isInCheck(opponentKing, currentPlayer()).length) soundAlert('check');

    if (from == 5) { castle.recordMove(1); castle.recordMove(8); }      // black king moved, disable castle
    if (from == 61) { castle.recordMove(57); castle.recordMove(64); }   // white king moved, disable castle
    if (castle.isRook(from)) { castle.recordMove(from); }               // rook moved, disable castle on this rook side

    squareArr = copySquareArr;
    return true;
}

// selfCheck-   square= currentKing,    attackerColour= opponent()
// check-       square= oppenentKing,   attackerColour= currentPlayer()
// isInCheck-   can be applied to any piece (not just King) to identify attacks to that piece
function isInCheck(square, attackerColour) {

    let rtnVal = [];
    const checks = [];
    const checkers = [];
    const path = [];
    const calledFrom = attackerColour == opponent() ? 'selfCheck' : 'check';

    [compassCheck(square, attackerColour),
    knightCheck(square, attackerColour),
    pawnCheck(square, attackerColour)
    ].forEach((rtn) => { if (rtn !== undefined) checks.push(rtn) });   // fill checks array with path of attack

    checks.forEach((lines) => {
        lines.forEach((line) => {
            line.forEach((sqr, index, sqrArr) => {
                if (index == sqrArr.length - 1) { checkers.push(sqr); }   // fill checkers and path arrays to check for mate  
                else { path.push(sqr); }
            })
        });
    });
    
    rtnVal= checkers;
    if(checkers.length==0) return checkers;

    if (calledFrom == 'check') {  // subsequent conditions are looking for mate against opponent 

        if(canKingMove(square,false)) return checkers;

        if (checkers.length == 2){   // two checkers
            console.log(`Double check:  ${squareArr[square]} at ${square} must move to relieve check`);                    
            canKingMove(square, true)
            return checkers;
        } 

        if (checkers.length == 1) {     // one checker  // BUG - if not needed

            let canRemove= false;            
            const checkRemovers= isInCheck(checkers[0], opponent());    // squares that can remove the Knight

            if(checkRemovers.length){                                   // if removal of check exists
                console.log(`who can remove check? ${checkRemovers}`);
                for (const remover of checkRemovers) {                  // for each remover, copy board, simulate removal, change player
                    let copySquareArr = JSON.parse(JSON.stringify(squareArr));
                    squareArr[checkers[0]] = squareArr[remover];
                    squareArr[remover] = '';
                    
                    changePlayer();
                    let kingAt= squareArr.indexOf(currentPlayer() +'k');            // locatiion of King under check
                    if (!isInCheck(kingAt, opponent()).length) canRemove = true;    //  self-check after removal, change player, restore board
                    changePlayer();
                    squareArr= copySquareArr;
                    if(canRemove) return checkers;  // no self-check upon removal of checker, break loop
                }
            }

            // checkRemovers ignores enPassant, if checker is a pawn, send checker square to canEnPassant()
            if(pieceAt(checkers[0])== 'p'){
                if(canEnPassant(checkers[0], attackerColour)) return checkers;
                mate=true;
                gameOver(`Congratulations ${formatColour(currentPlayer())}. That's a cZechMate. No En Passant`, 'checkMate')
            }

            // checker is pawn or knight and can't be removed, King must move
            if(pieceAt(checkers[0])== 'p' || pieceAt(checkers[0])=='n' || path.length== 0){
                canKingMove(square,true);   // we know King cant move already... hmmmm
                return checkers;
            }

            if(path.length){
                let canBlock = false;                
                for( sqr of path){

                    //  pretend sqr is currentKing to find pieces to fill the square
                    const blockers= isInCheck(sqr, opponent());
                    let offset= currentPlayer()=='w'? -8: 8;
                    if(squareArr[sqr +offset]== opponent() +'p') blockers.push(sqr +offset);

                    if(blockers.length){
                        for(block of blockers){
                            // console.log(`square: ${sqr} can be blocked by ${block}`)
                            let copySquareArr = JSON.parse(JSON.stringify(squareArr));
                            squareArr[sqr] = squareArr[block];
                            squareArr[block] = '';
                            let kingAt= squareArr.indexOf(opponent() +'k');            // locatiion of currentPlayer King
                            if (!isInCheck(kingAt, currentPlayer()).length) canBlock = true;    //  self-check after block and restore board
                            squareArr= copySquareArr;
                            if(canBlock){
                                // console.log('we have a blocker');
                                return checkers;   // no self-check after blocker moves, exit function
                            }
                        }
                    }
                }
                if(!canBlock) gameOver(`Congratulations ${formatColour(currentPlayer())}. That's a cZechMate `, 'checkMate');
            }                
        }
    }
    return rtnVal;
}

function canKingMove(square, dire){     // square= location of King under check,  dire= King must move or DIE

    const target = [1, -1, 7, -7, 8, -8, 9, -9];    // moves for the King to try
    const validKingMoves = [];
    let canMove = false;

    changePlayer();     // opponent causes check, so change player to analyze potential king moves
    target.forEach((move) => { if(validKing(square, square + move)) validKingMoves.push(square + move);});  // store valid moves

    for (const kingMove of validKingMoves) {
        let copySquareArr = JSON.parse(JSON.stringify(squareArr));
        squareArr[square] = '';
        squareArr[kingMove] = currentPlayer() + 'k';
        if (!isInCheck(kingMove, opponent()).length) canMove = true;    // test valid King moves for self-checks
        squareArr = copySquareArr;
    }

    changePlayer();
    if(!canMove && dire){ gameOver(`Congratulations ${formatColour(currentPlayer())}. That's a cZechMate `, 'checkMate');}     // If King must move but can not... GAME OVER  
    return canMove;                         // assumed King can not move, unless King has at least one safe square to move to
}

function compassCheck(square, attackerColour) {     // scan attack lines for Queen, Rook and Bishop

    let rtnVal = undefined;
    const checks = [];
    const attackLines = [
        // Array of objects containing an attacking piece, initializer, condition function, and incrementer for the nested loops below
        // first four elements dedicated to Rook and Queen lines, the last four are Bishop and Queen lines
        { piece: 'r', start: square + 8, condition: (path) => path <= 64, increment: 8 },                              // South
        { piece: 'r', start: square - 8, condition: (path) => path >= 1, increment: -8 },                              // North
        { piece: 'r', start: square - 1, condition: (path) => rank(path) === rank(square), increment: -1 },             // West
        { piece: 'r', start: square + 1, condition: (path) => rank(path) === rank(square), increment: 1 },             // East
        { piece: 'b', start: square - 9, condition: (path) => path >= 1 && file(path) < file(square), increment: -9 }, // North-West
        { piece: 'b', start: square + 9, condition: (path) => path <= 64 && file(path) > file(square), increment: +9 }, // South-East
        { piece: 'b', start: square - 7, condition: (path) => path >= 1 && file(path) > file(square), increment: -7 }, // North-East
        { piece: 'b', start: square + 7, condition: (path) => path <= 64 && file(path) < file(square), increment: +7 }, // South-West
    ];

    for (let i = 0; i < attackLines.length; i++) {
        const checkLine = [];
        const { piece, start, condition, increment } = attackLines[i];          // annonymous object properties assigned from attackLines elements 
        for (let path = start; condition(path); path += increment) {            // annonymous object properties dictate for loop settings
            checkLine.push(path)
            if (squareArr[path] === '') continue;
            if (squareArr[path] === attackerColour + piece || squareArr[path] === attackerColour + 'q') {   // is attacker present
                // current player attacking, then check for check(s)
                checks.push(checkLine);
                // console.log(`Oh Oh... ${squareArr[square]} at ${square} is in cZech  by the ${attackerColour + squareArr[path].charAt(1)}`);
                rtnVal = checks;
                break;
            }
            else { break; }       // non threatening piece found
        }
    }
    return rtnVal; // Could not find check, return false
}

function pawnCheck(square, attackerColour) {  //REVISED REVISED

    const checks= [];
    const defender = squareArr[square].charAt(0);

    if (defender == 'w') {
        if (squareArr[square - 7] == 'bp' && file(square) != 8) checks.push( [square - 7] );     // bp attacking wk from NE
        if (squareArr[square - 9] == 'bp' && file(square) != 1) checks.push( [square - 9] );     // bp attacking wk from NW
    }
    if (defender == 'b') {
        if (squareArr[square + 7] == 'wp' && file(square) != 1) checks.push ( [square + 7] );     // wp attacking bk from SW
        if (squareArr[square + 9] == 'wp' && file(square) != 8) checks.push ( [square + 9] );     // wp attacking bk from SE
    }
    if (checks.length) { getId('moveMessage').textContent=
            `Oh Oh... ${formatColour(playerAt(square))} ${formatType(pieceAt(square))} \n
             on ${formatFile(file(square))}${rank(square)} is in cZech by \n
             the ${checks < square? formatColour('b'): formatColour('w')} pawn`;
    }
    return checks;
}

function knightCheck(square, attackerColour) {             // scan hops of the knight

    const checks= [];
    const attackLines = [6, -6, 10, -10, 15, -15, 17, -17];     // hops measure the distance between king and knight

    for (let path of attackLines) {
        const knightAt = square + path;
        if (knightAt >= 1 && knightAt <= 64) {                      //prevent breach of border North and South
            if (getId(square).style.background != getId(knightAt).style.background) {     // knight moves to opposite square colour
                if (squareArr[knightAt] == attackerColour + 'n') {                         // attacking knight found
                    checks.push([knightAt]);
                }
            }
        }
    }
    return checks;
}

function canPieceMove(from, colour){    // switch piece type- evaluate case for closest square in every direction the piece allows
  
    let path;
    switch(pieceAt(from)){

      case 'p': 
        if(colour =='w') {path= [-7,-8,-9];}
        else {path= [7,8,9];}
        for(const direction of path){
            // if(validPawn(from, from + Number(direction))) return true;
            if(validMove(from, from + Number(direction), pieceAt(from))) return true;
        }
        break;
        
      case 'q':
        path= [-1,1,-7,7,-9,9,-8,8];
        for(const direction of path){
            if(validQueen(from, from + Number(direction))) return true;
        }
        break;
      
      case 'b':
        path= [-9,9,-7,7];
        for(const direction of path){
            if(validBishop(from, from +Number(direction))) return true;
        }
        break;
      
      case 'r':
        path = [-1,1,-8,8];
        for(const direction of path){
            if(validRook(from, from + Number(direction))) return true;
        }
        break;
      
      case 'n':
        path= [-6,6,-10,10,-15,15,-17,17];
        for(const direction of path){
            if(validKnight(from, from + Number(direction))) return true;
        }
        break;
      
      default:
        console.log('testing moves for unknown piece.  Lionel Ritchie');
        break;
    }
    return false;
}

function canEnPassant(square, attackerColour){   // square= pawn checking the King, attackerColour is colour of checking pawn
    
    let rtnVal = false;
    let copySquareArr = JSON.parse(JSON.stringify(squareArr));
    const enPassant= attackerColour=='w'? 'bp': 'wp';         // the enPassant pawn beside attacker is opposite colour
    const to= enPassant.startsWith('w')? square -8: square +8;

    changePlayer();
    const kingAt= squareArr.indexOf(currentPlayer() + 'k');  // defending King

    if( (squareArr[square+1]== enPassant && file(square) !=8) // check for enPassant pawn to the right with right border control
        && ( (enPassant.startsWith('w') && wPassant.move== moves.length) 
            || (enPassant.startsWith('b') && bPassant.move==moves.length) ) ){                

            squareArr[to]= squareArr[square +1];
            squareArr[square +1]= '';
            squareArr[square]= '';            
            if(isInCheck(kingAt, opponent()).length) rtnVal= false;
            // else rtnVal= true;
            else return true;
    }

    if ( (squareArr[square-1]== enPassant && file(square) !=1)          // check for enPassant pawn to the left with left border control
        && ( (enPassant.startsWith('w') && wPassant.move== moves.length) 
            || (enPassant.startsWith('b') && bPassant.move==moves.length) ) ){                

                squareArr[to]= squareArr[square-1];
                squareArr[square-1]= '';
                squareArr[square]= '';
                if(isInCheck(kingAt, opponent()).length) rtnVal= false;
                else rtnVal= true;
    }
    changePlayer();
    squareArr=copySquareArr;
    console.log("I checked for legal en Passant");
    return rtnVal;
}

function gameOver(msg, sound){

    const navs = document.querySelectorAll('.navButton');
    const squares = document.querySelectorAll('.square');

    squares.forEach(square => square.classList.add('disabled'));        // provide a disabled look to board during promotion selection
    soundAlert(sound);
    getId('moveMessage').textContent= msg;
    console.log(msg);

    navs.forEach(nav => {   // each navigator button assigned event handler and cursor pointers
        nav.addEventListener('mouseenter', () => nav.style.cursor='pointer');
        nav.addEventListener('mouseleave', () => nav.style.cursor='pointer');
        nav.addEventListener('click', (e) => moveHistory(e));
    })
}

function moveHistory(e){        // switch event currentTarget id to adjust navigator index accordingly
   
    let board;
    let indexMax= moves.length -1
    let index=Number(getId('moveHistory').dataset.navIndex);
    

    console.log(e.currentTarget.id);
    switch(e.currentTarget.id){
        case 'first':
            index= 0;
            break;

        case 'back':            
            index= index==0? 0: index-1
            break;

        case 'forward':
            index= index < indexMax? index +1: indexMax;     
            break;

        case 'last':
            index= indexMax;
            break;

        default: console.log('nav button unknown');
    }
    
    //  adjust navigator index  // set BOARD using the navigator index, to that element in moves array
    board= moves[index].board;
    getId('moveHistory').dataset.navIndex= index;
    getId('moveMessage').textContent= `index: ${index}   max: ${indexMax}`;
    
    for(let i=1; i<65; i++){        // use our BOARD instance to reset and redraw each square
        getId(i).innerHTML='';
        if(board[i]=='') continue;    
        
        let img=document.createElement('img');
        img.src= `assets/images/${board[i]}.png`; 
        getId(i).appendChild(img);
    }
}

Array.prototype.hasEqualElements = function (arr) {

    const equalElements = [];
    for (outter of this) {      // THIS= array preceding the method call.. example...  THIS.hasEqualElements(otherArray)
        for (inner of arr) {    // other array
            if (inner === outter) {
                if (!equalElements.includes(inner)) {   // (! includes) avoids duplication of equal elements listed multiple times
                    equalElements.push(inner);
                }
            }
        }
    }
    if (equalElements.length) return equalElements;  //BUG no IF, just return
}

// ************ Executable Code **************** //
// ********************************************* //

Lionel();
setWidth("60px");
setColumns(columns);
printBoard(columns);

// both validKnight() and validKing() can return nothing and leave an undefined value for rtnVal in validMove()
// WHAT ABOUT PROMOTION SIMULATION ?????????????
