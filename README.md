yo, so this is how u run dis ting:

1.open VSCode
2.open the terminal (ctrl + `)
3.make sure it says "bla:\blabla\blabla\ **TrueWork-main**>"

#### 4. Run the front-end 🍆:
  4.0 click on the '+' sign on the terminal *(you'll see it on the top bar of the terminal)* and type the following
  4.1 cd frontend
  4.2 yarn install          (I used yarn cuz npm was a being a pain in my ass)
  4.3 yarn start
  ---wait for it to load and shit---
  4.3 ctrl + click on the local host link

  you should have the front-end open now

#### 5. Run the back-end 🍑:
  5.0 click on the '+' sign on the terminal *(you'll see it on the top bar of the terminal)* and type the following
  5.1 cd backend
  5.2 python -m venv .venv
  5.3 .venv\Scripts\activate
  5.4 pip install -r requirements.txt
  5.5 python -m uvicorn app.main:app --reload --port 8000


  # !!! YARN INSTALLATION GUIDE IF YOU DON'T HAVE IT ALREADY !!!
  npm install --global yarn

  ^^ that's it lol ^^
