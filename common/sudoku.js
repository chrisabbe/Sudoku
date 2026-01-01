/* ===== SHARED SUDOKU ENGINE ===== */

window.Sudoku = {
  load(config){

    const {
      id,
      difficulty,
      diffClass,
      puzzleString
    } = config;

    document.querySelector(".diff").classList.add(diffClass);
    document.querySelector(".diff").innerText = difficulty;

    const STORAGE_KEY = `sudoku_${id}`;
    const CLEAR_FLAG  = `sudoku_${id}_cleared`;

    const gridEl   = document.getElementById("sudoku");
    const clearBtn = document.getElementById("clearBtn");
    const statusEl = document.getElementById("status");

    function getCookie(name){
      const m=document.cookie.match(new RegExp('(^| )'+name+'=([^;]+)'));
      return m?m[2]:"";
    }
    function setCookie(name,val){
      const d=new Date(); d.setTime(d.getTime()+864e5);
      document.cookie=`${name}=${val};expires=${d.toUTCString()};path=/`;
    }

    let saved={};
    if(getCookie(CLEAR_FLAG)!=="true"){
      try{
        const raw=localStorage.getItem(STORAGE_KEY);
        if(raw) saved=JSON.parse(raw);
      }catch(e){}
    }

    const puzzle=[];
    for(let i=0;i<9;i++){
      puzzle.push(
        puzzleString.slice(i*9,i*9+9).split("").map(n=>+n)
      );
    }

    const cells=[...Array(9)].map(()=>Array(9));

    function build(){
      gridEl.innerHTML="";
      for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
          const cell=document.createElement("div");
          cell.className="cell";

          if((Math.floor(r/3)+Math.floor(c/3))%2===0)
            cell.classList.add("shaded");

          if(c%3===0) cell.style.borderLeft="2px solid #bbb";
          if(c===8)   cell.style.borderRight="2px solid #bbb";
          if(r%3===0) cell.style.borderTop="2px solid #bbb";
          if(r===8)   cell.style.borderBottom="2px solid #bbb";

          const v=puzzle[r][c];
          if(v){
            const g=document.createElement("div");
            g.className="given";
            g.textContent=v;
            cell.appendChild(g);
            cells[r][c]={given:g,input:null,val:v};
          }else{
            const inp=document.createElement("input");
            inp.maxLength=1;
            inp.inputMode="numeric";
            inp.pattern="[1-9]";
            const key=`${r}-${c}`;

            if(saved[key]) inp.value=saved[key];

            inp.oninput=()=>{
              inp.value=inp.value.replace(/[^1-9]/g,"").slice(0,1);
              if(inp.value) saved[key]=inp.value;
              else delete saved[key];
              try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch(e){}
              setCookie(CLEAR_FLAG,"false");
              validate();
            };

            cell.appendChild(inp);
            cells[r][c]={given:null,input:inp,val:0};
          }

          gridEl.appendChild(cell);
        }
      }
      validate();
    }

    clearBtn.onclick=()=>{
      for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
          const s=cells[r][c];
          if(s.input) s.input.value="";
        }
      }
      try{localStorage.removeItem(STORAGE_KEY);}catch(e){}
      setCookie(CLEAR_FLAG,"true");
      saved={};
      validate();
    };

    function validate(){
      let grid=[...Array(9)].map(()=>Array(9).fill(0));
      for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
          const s=cells[r][c];
          if(s.given) grid[r][c]=s.val;
          if(s.input && s.input.value) grid[r][c]=+s.input.value;
          if(s.input) s.input.classList.remove("conflict");
          if(s.given) s.given.classList.remove("conflict");
        }
      }

      let conflicts=0;
      function mark(r,c){
        const s=cells[r][c];
        if(s.input && !s.input.classList.contains("conflict")){
          s.input.classList.add("conflict"); conflicts++;
        }
        if(s.given && !s.given.classList.contains("conflict")){
          s.given.classList.add("conflict"); conflicts++;
        }
      }

      for(let i=0;i<9;i++){
        let row={}, col={};
        for(let j=0;j<9;j++){
          const rv=grid[i][j], cv=grid[j][i];
          if(rv){ if(row[rv]!=null){mark(i,j);mark(i,row[rv]);} else row[rv]=j; }
          if(cv){ if(col[cv]!=null){mark(j,i);mark(col[cv],i);} else col[cv]=j; }
        }
      }

      for(let br=0;br<3;br++){
        for(let bc=0;bc<3;bc++){
          let seen={};
          for(let r=br*3;r<br*3+3;r++){
            for(let c=bc*3;c<bc*3+3;c++){
              const v=grid[r][c];
              if(v){
                if(seen[v]){ const [rr,cc]=seen[v]; mark(r,c); mark(rr,cc); }
                else seen[v]=[r,c];
              }
            }
          }
        }
      }

      statusEl.innerText=`Conflicts: ${conflicts}`;
    }

    build();
  }
};
