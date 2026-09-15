# ⚡ Zeus Legacy — Առցանց Slot Հարթակ

**Zeus Legacy**-ը fullstack խաղային հարթակ է, որտեղ օգտատերերը կարող են խաղալ slot machine իրական ժամանակի մեխանիկայով, բոնուսային համակարգով և ապահով գործարքների կառավարմամբ։

🌐 **Կայք՝** [zeus-legacy-alpha.vercel.app](https://zeus-legacy-alpha.vercel.app)
📂 **Կոդ՝** [github.com/Narek-Momchyan/Zeus_Legacy](https://github.com/Narek-Momchyan/Zeus_Legacy)



---

## 💡 Ի՞նչ է անում հավելվածը

- ⚡ **Իրական ժամանակի խաղ** — WebSocket-ի միջոցով արդյունքները թարմացվում են անմիջապես՝ առանց էջի վերաբեռնման
- 🎰 **Tumble / Cascade մեխանիկա** — հաղթող կոմբինացիաների դեպքում նոր խորհրդանիշներ ընկնում են, ստեղծելով շղթայական հաղթանակներ
- 📈 **Դինամիկ բազմապատկիչներ** — հաղթանակի հետ ավտոմատ աճող multiplier-ներ
- 🛒 **Bonus Buy համակարգ** — օգտատերը կարող է անմիջապես գնել բոնուս ռաունդ
- 🔒 **Ապահով գործարքներ** — բոլոր ֆինանսական գործողությունները գրանցվում են REST API-ի միջոցով

---

## 🛠️ Օգտագործված տեխնոլոգիաներ

| | Տեխնոլոգիա | Նպատակ |
|---|---|---|
| **Frontend** | Next.js + React | Արագ, ռեսպոնսիվ UI |
| **Styling** | Tailwind CSS | Արագ դիզայն |
| **Backend** | Django + Django REST Framework | REST API, բիզնես տրամաբանություն |
| **Real-time** | WebSockets | Ակնթարթային կապ client-server |
| **Deployment** | Vercel (frontend) + Render (backend) | Production hosting |

---

## 👨‍💻 Ի՞նչ սովորեցի այս պրոյեկտից

- WebSocket-ի ինտեգրում՝ client-server իրական ժամանակի հաղորդակցության համար
- Բարդ խաղային մեխանիկայի (cascade, multiplier) ծրագրավորում
- Django REST Framework-ով ֆինանսական գործարքների անվտանգ կառավարում
- Frontend-ի և backend-ի synchronization WebSocket-ի միջոցով
- Fullstack deployment՝ Vercel + Render համակցությամբ
- AI-assisted tooling-ի կիրառում development գործընթացում

---

## 🚀 Տեղական գործարկում

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Backend
```bash
cd Backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Frontend՝ [http://localhost:3000](http://localhost:3000) · Backend՝ [http://localhost:8000](http://localhost:8000)

---

