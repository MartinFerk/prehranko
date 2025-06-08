# 🥗 Prehranko

**Prehranko** je sodoben prehranski asistent, ki združuje mobilno aplikacijo in spletni portal za sledenje obrokom, prehranskih ciljev ter preverjanje identitete uporabnika preko prepoznave obraza.





## 📱 Mobilna aplikacija

- ✅ **Registracija z identifikacijo obraza**  
  Ob registraciji se uporabnik slikovno identificira – za večjo varnost sistema.

- 📸 **Slikanje hrane**  
  Uporabnik lahko hitro dodaja obroke s pomočjo kamere.

- 🎯 **Nastavitev dnevnih ciljev**  
  Možnost nastavitve dnevnega cilja za kalorije in beljakovine.

- 🔒 **2FA preverjanje**  
  Ob prijavi v spletno aplikacijo mora uporabnik opraviti prepoznavo obraza na mobilni napravi.

- 🗑️ **Odstranitev obroka**  
  Po želji lahko uporabnik izbriše poljuben vpis iz sistema.





## 💻 Spletna aplikacija

- 🗺️ **Zemljevidski prikaz recent obrokov**  
  Vizualni pregled obrokov uporabnikov glede na geografsko lokacijo.

- 🏆 **Lestvice najboljših**  
  Prikaz najboljših obrokov (po kalorijah in beljakovinah) ter najbolj aktivnih uporabnikov.

- 📊 **Vizualizirana statistika uporabnika**  
  Pregled napredka in prehranskih podatkov skozi čas z uporabo interaktivnih grafov.



## ⚙️ Uporabljene tehnologije

| Tehnologija         | Uporaba                                                                 |
|---------------------|-------------------------------------------------------------------------|
| **React**           | Frontend spletne aplikacije – hitra in modularna izdelava UI komponent |
| **React Native**    | Mobilna aplikacija za Android in iOS                                   |
| **Expo**            | Pospešena mobilna razvojna izkušnja s hitrim zagonom in testiranjem    |
| **MongoDB & Mongoose** | Shranjevanje podatkov o uporabnikih, obrokih, ciljih itd.         |
| **Python**          | Izvedba modela za prepoznavo obraza (embedding in primerjava)          |
| **MQTT**            | Komunikacija med mobilno napravo in strežnikom (za 2FA signalizacijo)  |
| **Railway**         | Gostovanje backend API-ja in MongoDB baze                              |

---
Avtorji:
Jan Kupčič, Paskal Trstenjak, Martin Ferk
