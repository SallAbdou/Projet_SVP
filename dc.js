class DCLogic{constructor(p){this.props=p||{};this.state={}}setState(s){Object.assign(this.state,s);try{if(s.lang)localStorage.setItem('pq-lang',s.lang)}catch(e){}window.__render()}}
