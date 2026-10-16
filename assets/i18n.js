/* Tradução da interface: o texto original está em português; as línguas sem tradução própria usam inglês. */
(function(){
  const ORDER="en|es|fr|de|it|nl|pl|ru|tr|ar|zh|ja|ko|hi|id|sv".split("|");
  const FULL=[
    ["pt","Português"],["en","English"],["es","Español"],["fr","Français"],["de","Deutsch"],["it","Italiano"],["nl","Nederlands"],["pl","Polski"],
    ["ru","Русский"],["tr","Türkçe"],["ar","العربية"],["zh","中文"],["ja","日本語"],["ko","한국어"],["hi","हिन्दी"],["id","Bahasa Indonesia"],["sv","Svenska"]
  ];
  const PARTIAL=[
    ["af","Afrikaans"],["sq","Shqip"],["am","አማርኛ"],["hy","Հայերեն"],["az","Azərbaycanca"],["eu","Euskara"],["be","Беларуская"],["bn","বাংলা"],["bs","Bosanski"],["bg","Български"],
    ["my","မြန်မာ"],["ca","Català"],["ceb","Cebuano"],["cs","Čeština"],["hr","Hrvatski"],["da","Dansk"],["sk","Slovenčina"],["sl","Slovenščina"],["et","Eesti"],["fil","Filipino"],
    ["fi","Suomi"],["gl","Galego"],["ka","ქართული"],["el","Ελληνικά"],["gu","ગુજરાતી"],["ht","Kreyòl ayisyen"],["ha","Hausa"],["he","עברית"],["hu","Magyar"],["is","Íslenska"],
    ["ig","Igbo"],["ga","Gaeilge"],["kk","Қазақша"],["km","ខ្មែរ"],["ku","Kurdî"],["ky","Кыргызча"],["lo","ລາວ"],["la","Latina"],["lv","Latviešu"],["lt","Lietuvių"],
    ["lb","Lëtzebuergesch"],["mk","Македонски"],["mg","Malagasy"],["ms","Bahasa Melayu"],["ml","മലയാളം"],["mt","Malti"],["mi","Māori"],["mr","मराठी"],["mn","Монгол"],["ne","नेपाली"],
    ["no","Norsk"],["or","ଓଡ଼ିଆ"],["ps","پښتو"],["fa","فارسی"],["pa","ਪੰਜਾਬੀ"],["ro","Română"],["sr","Српски"],["si","සිංහල"],["so","Soomaali"],["sw","Kiswahili"],
    ["tg","Тоҷикӣ"],["ta","தமிழ்"],["te","తెలుగు"],["th","ไทย"],["ti","ትግርኛ"],["tk","Türkmençe"],["uk","Українська"],["ur","اردو"],["uz","Oʻzbekcha"],["vi","Tiếng Việt"],
    ["cy","Cymraeg"],["xh","isiXhosa"],["yi","ייִדיש"],["yo","Yorùbá"],["zu","isiZulu"],["zh-TW","繁體中文"],["yue","粵語"],["sd","سنڌي"],["kn","ಕನ್ನಡ"],["jv","Basa Jawa"],["su","Basa Sunda"]
  ];
  const DICT=new Map(),TEMPLATES=[];
  function A(pt,list){
    const v=list.split("|"),m={};ORDER.forEach((c,i)=>m[c]=v[i]);
    if(pt.includes("{0}")){
      const re=new RegExp("^"+pt.replace(/[.*+?^$()|[\]\\]/g,"\\$&").replace(/\{(\d)\}/g,"(\\d+)")+"$");
      TEMPLATES.push([re,m]);
    } else DICT.set(pt,m);
  }
  A("Visão geral","Overview|Resumen|Aperçu|Übersicht|Panoramica|Overzicht|Przegląd|Обзор|Genel Bakış|نظرة عامة|概览|概要|개요|अवलोकन|Ringkasan|Översikt");
  A("Plantel","Roster|Plantilla|Effectif|Kader|Rosa|Selectie|Skład|Состав|Kadro|التشكيلة|阵容|ロスター|로스터|टीम सूची|Roster|Trupp");
  A("Treino","Training|Entrenamiento|Entraînement|Training|Allenamento|Training|Trening|Тренировка|Antrenman|التدريب|训练|トレーニング|훈련|प्रशिक्षण|Latihan|Träning");
  A("Competições","Competitions|Competiciones|Compétitions|Wettbewerbe|Competizioni|Competities|Rozgrywki|Соревнования|Turnuvalar|البطولات|赛事|大会|대회|प्रतियोगिताएँ|Kompetisi|Tävlingar");
  A("Ranked & scrims","Ranked & scrims|Ranked y scrims|Classé et scrims|Ranked & Scrims|Classificate e scrim|Ranked & scrims|Ranking i scrimy|Рейтинг и скримы|Dereceli ve scrim|المصنفة والتدريبية|排位与训练赛|ランク&スクリム|랭크 & 스크림|रैंक्ड और स्क्रिम|Ranked & scrim|Ranked & scrims");
  A("Calendário","Calendar|Calendario|Calendrier|Kalender|Calendario|Kalender|Kalendarz|Календарь|Takvim|التقويم|日程|カレンダー|캘린더|कैलेंडर|Kalender|Kalender");
  A("Ligas","Leagues|Ligas|Ligues|Ligen|Leghe|Liga's|Ligi|Лиги|Ligler|الدوريات|联赛|リーグ|리그|लीग|Liga|Ligor");
  A("Seleções","National teams|Selecciones|Sélections|Nationalteams|Nazionali|Nationale teams|Reprezentacje|Сборные|Milli Takımlar|المنتخبات|国家队|代表チーム|국가대표|राष्ट्रीय टीमें|Tim nasional|Landslag");
  A("Observatório","Scouting|Ojeo|Recrutement|Scouting|Osservazione|Scouting|Skauting|Скаутинг|Gözlemevi|الكشافة|球探|スカウト|스카우팅|स्काउटिंग|Pencarian bakat|Scouting");
  A("Mercado","Market|Mercado|Marché|Markt|Mercato|Markt|Rynek|Рынок|Pazar|السوق|转会市场|市場|시장|बाज़ार|Pasar|Marknad");
  A("Clube","Club|Club|Club|Verein|Club|Club|Klub|Клуб|Kulüp|النادي|俱乐部|クラブ|클럽|क्लब|Klub|Klubb");
  A("Competir","Compete|Competir|Compétition|Wettkampf|Competi|Competitie|Rywalizacja|Соревноваться|Yarış|المنافسة|竞技|対戦|경쟁|प्रतिस्पर्धा|Bertanding|Tävla");
  A("Definições","Settings|Ajustes|Paramètres|Einstellungen|Impostazioni|Instellingen|Ustawienia|Настройки|Ayarlar|الإعدادات|设置|設定|설정|सेटिंग्स|Pengaturan|Inställningar");
  A("Fechar","Close|Cerrar|Fermer|Schließen|Chiudi|Sluiten|Zamknij|Закрыть|Kapat|إغلاق|关闭|閉じる|닫기|बंद करें|Tutup|Stäng");
  A("Áudio","Audio|Audio|Audio|Audio|Audio|Audio|Dźwięk|Звук|Ses|الصوت|音频|オーディオ|오디오|ऑडियो|Audio|Ljud");
  A("Volume geral","Master volume|Volumen general|Volume général|Gesamtlautstärke|Volume generale|Hoofdvolume|Głośność główna|Общая громкость|Ana ses|مستوى الصوت العام|主音量|マスター音量|마스터 볼륨|मुख्य वॉल्यूम|Volume utama|Huvudvolym");
  A("Música","Music|Música|Musique|Musik|Musica|Muziek|Muzyka|Музыка|Müzik|الموسيقى|音乐|音楽|음악|संगीत|Musik|Musik");
  A("Efeitos","Effects|Efectos|Effets|Effekte|Effetti|Effecten|Efekty|Эффекты|Efektler|المؤثرات|音效|効果音|효과음|प्रभाव|Efek|Effekter");
  A("Silenciar tudo","Mute all|Silenciar todo|Tout couper|Alles stummschalten|Silenzia tutto|Alles dempen|Wycisz wszystko|Отключить звук|Tümünü sustur|كتم الكل|全部静音|すべてミュート|모두 음소거|सब म्यूट करें|Bisukan semua|Ljud av");
  A("Ecrã","Display|Pantalla|Affichage|Anzeige|Schermo|Scherm|Ekran|Экран|Ekran|الشاشة|显示|画面|화면|डिस्प्ले|Layar|Skärm");
  A("Modo de ecrã","Display mode|Modo de pantalla|Mode d'affichage|Anzeigemodus|Modalità schermo|Weergavemodus|Tryb ekranu|Режим экрана|Ekran modu|وضع الشاشة|显示模式|表示モード|화면 모드|डिस्प्ले मोड|Mode layar|Visningsläge");
  A("Janela","Windowed|Ventana|Fenêtré|Fenster|Finestra|Venster|Okno|Окно|Pencere|نافذة|窗口|ウィンドウ|창 모드|विंडो|Jendela|Fönster");
  A("Ecrã inteiro em janela","Borderless fullscreen|Pantalla completa sin bordes|Plein écran fenêtré|Rahmenloser Vollbildmodus|Schermo intero senza bordi|Randloos volledig scherm|Pełny ekran w oknie|Полноэкранное окно|Kenarlıksız tam ekran|ملء الشاشة بدون إطار|无边框全屏|ボーダーレス全画面|전체 창 모드|बॉर्डरलेस फ़ुलस्क्रीन|Layar penuh tanpa bingkai|Kantlöst helskärm");
  A("Ecrã inteiro","Fullscreen|Pantalla completa|Plein écran|Vollbild|Schermo intero|Volledig scherm|Pełny ekran|Полный экран|Tam ekran|ملء الشاشة|全屏|全画面|전체 화면|फ़ुलस्क्रीन|Layar penuh|Helskärm");
  A("Resolução","Resolution|Resolución|Résolution|Auflösung|Risoluzione|Resolutie|Rozdzielczość|Разрешение|Çözünürlük|الدقة|分辨率|解像度|해상도|रिज़ॉल्यूशन|Resolusi|Upplösning");
  A("Automática","Automatic|Automática|Automatique|Automatisch|Automatica|Automatisch|Automatyczna|Авто|Otomatik|تلقائي|自动|自動|자동|स्वचालित|Otomatis|Automatisk");
  A("Escala da interface","Interface scale|Escala de la interfaz|Échelle de l'interface|Oberflächenskalierung|Scala interfaccia|Interfaceschaal|Skala interfejsu|Масштаб интерфейса|Arayüz ölçeği|مقياس الواجهة|界面缩放|UIスケール|인터페이스 크기|इंटरफ़ेस स्केल|Skala antarmuka|Gränssnittsskala");
  A("Reduzir animações","Reduce animations|Reducir animaciones|Réduire les animations|Animationen reduzieren|Riduci animazioni|Animaties verminderen|Ogranicz animacje|Уменьшить анимацию|Animasyonları azalt|تقليل الحركة|减少动画|アニメーションを減らす|애니메이션 줄이기|एनिमेशन कम करें|Kurangi animasi|Minska animationer");
  A("Guardar agora","Save now|Guardar ahora|Sauvegarder|Jetzt speichern|Salva ora|Nu opslaan|Zapisz teraz|Сохранить|Şimdi kaydet|احفظ الآن|立即保存|今すぐ保存|지금 저장|अभी सहेजें|Simpan sekarang|Spara nu");
  A("Sair para o menu principal","Exit to main menu|Salir al menú principal|Retour au menu principal|Zum Hauptmenü|Esci al menu principale|Naar hoofdmenu|Wyjdź do menu głównego|В главное меню|Ana menüye çık|الخروج إلى القائمة الرئيسية|返回主菜单|メインメニューへ|메인 메뉴로|मुख्य मेनू पर जाएँ|Keluar ke menu utama|Till huvudmenyn");
  A("Repor predefinições","Reset to defaults|Restablecer valores|Réinitialiser|Zurücksetzen|Ripristina predefiniti|Standaard herstellen|Przywróć domyślne|Сбросить|Varsayılanlara dön|إعادة الضبط|恢复默认|初期設定に戻す|기본값 복원|डिफ़ॉल्ट पर रीसेट|Atur ulang|Återställ");
  A("Idioma","Language|Idioma|Langue|Sprache|Lingua|Taal|Język|Язык|Dil|اللغة|语言|言語|언어|भाषा|Bahasa|Språk");
  A("MODO CARREIRA","CAREER MODE|MODO CARRERA|MODE CARRIÈRE|KARRIEREMODUS|MODALITÀ CARRIERA|CARRIÈREMODUS|TRYB KARIERY|РЕЖИМ КАРЬЕРЫ|KARİYER MODU|وضع المسيرة|生涯模式|キャリアモード|커리어 모드|करियर मोड|MODE KARIER|KARRIÄRLÄGE");
  A("O teu próximo kickoff começa aqui.","Your next kickoff starts here.|Tu próximo saque inicial empieza aquí.|Ton prochain coup d'envoi commence ici.|Dein nächster Anstoß beginnt hier.|Il tuo prossimo calcio d'inizio parte da qui.|Je volgende aftrap begint hier.|Twój następny kickoff zaczyna się tutaj.|Твой следующий кикофф начинается здесь.|Bir sonraki kickoff'un burada başlıyor.|ضربة البداية القادمة تبدأ هنا.|你的下一次开球从这里开始。|次のキックオフはここから。|다음 킥오프가 여기서 시작됩니다.|आपका अगला किकऑफ़ यहीं से शुरू होता है।|Kickoff berikutnya dimulai di sini.|Din nästa avspark börjar här.");
  A("Nova carreira","New career|Nueva carrera|Nouvelle carrière|Neue Karriere|Nuova carriera|Nieuwe carrière|Nowa kariera|Новая карьера|Yeni kariyer|مسيرة جديدة|新生涯|新規キャリア|새 커리어|नया करियर|Karier baru|Ny karriär");
  A("Criar save","Create save|Crear partida|Créer une sauvegarde|Spielstand erstellen|Crea salvataggio|Opslag maken|Utwórz zapis|Создать сохранение|Kayıt oluştur|إنشاء حفظ|创建存档|セーブを作成|세이브 만들기|सेव बनाएँ|Buat simpanan|Skapa sparfil");
  A("Os teus saves","Your saves|Tus partidas|Tes sauvegardes|Deine Spielstände|I tuoi salvataggi|Jouw opslagen|Twoje zapisy|Твои сохранения|Kayıtların|ملفات حفظك|你的存档|あなたのセーブ|내 세이브|आपके सेव|Simpanan Anda|Dina sparfiler");
  A("Continuar","Continue|Continuar|Continuer|Fortsetzen|Continua|Doorgaan|Kontynuuj|Продолжить|Devam|متابعة|继续|続ける|계속|जारी रखें|Lanjutkan|Fortsätt");
  A("Voltar","Back|Volver|Retour|Zurück|Indietro|Terug|Wstecz|Назад|Geri|رجوع|返回|戻る|뒤로|वापस|Kembali|Tillbaka");
  A("Criar carreira","Create career|Crear carrera|Créer la carrière|Karriere erstellen|Crea carriera|Carrière maken|Utwórz karierę|Создать карьеру|Kariyer oluştur|إنشاء المسيرة|创建生涯|キャリアを作成|커리어 만들기|करियर बनाएँ|Buat karier|Skapa karriär");
  A("NOVA CARREIRA","NEW CAREER|NUEVA CARRERA|NOUVELLE CARRIÈRE|NEUE KARRIERE|NUOVA CARRIERA|NIEUWE CARRIÈRE|NOWA KARIERA|НОВАЯ КАРЬЕРА|YENİ KARİYER|مسيرة جديدة|新生涯|新規キャリア|새 커리어|नया करियर|KARIER BARU|NY KARRIÄR");
  A("Dificuldade","Difficulty|Dificultad|Difficulté|Schwierigkeit|Difficoltà|Moeilijkheid|Trudność|Сложность|Zorluk|الصعوبة|难度|難易度|난이도|कठिनाई|Kesulitan|Svårighetsgrad");
  A("Equipa inicial","Starting team|Equipo inicial|Équipe de départ|Startteam|Squadra iniziale|Startteam|Drużyna startowa|Начальная команда|Başlangıç takımı|الفريق الابتدائي|初始队伍|開始チーム|시작 팀|शुरुआती टीम|Tim awal|Startlag");
  A("Emblema da equipa","Team crest|Escudo del equipo|Écusson de l'équipe|Teamwappen|Stemma della squadra|Teamembleem|Herb drużyny|Эмблема команды|Takım arması|شعار الفريق|队徽|チームエンブレム|팀 엠블럼|टीम प्रतीक|Lambang tim|Lagemblem");
  A("Exportar saves","Export saves|Exportar partidas|Exporter les sauvegardes|Spielstände exportieren|Esporta salvataggi|Opslagen exporteren|Eksportuj zapisy|Экспорт сохранений|Kayıtları dışa aktar|تصدير الحفظ|导出存档|セーブを書き出す|세이브 내보내기|सेव निर्यात करें|Ekspor simpanan|Exportera sparfiler");
  A("Importar saves","Import saves|Importar partidas|Importer les sauvegardes|Spielstände importieren|Importa salvataggi|Opslagen importeren|Importuj zapisy|Импорт сохранений|Kayıtları içe aktar|استيراد الحفظ|导入存档|セーブを読み込む|세이브 가져오기|सेव आयात करें|Impor simpanan|Importera sparfiler");
  A("Levar saves para outro PC","Move saves to another PC|Llevar partidas a otro PC|Transférer vos sauvegardes sur un autre PC|Spielstände auf einen anderen PC übertragen|Sposta i salvataggi su un altro PC|Opslagen naar een andere pc verplaatsen|Przenieś zapisy na inny komputer|Перенос сохранений на другой ПК|Kayıtları başka bir bilgisayara taşı|نقل الحفظ إلى جهاز آخر|将存档转移到另一台电脑|別のPCにセーブを移す|다른 PC로 세이브 옮기기|सेव दूसरे पीसी पर ले जाएँ|Pindahkan simpanan ke PC lain|Flytta sparfiler till en annan dator");
  A("Sem carreiras guardadas","No saved careers|Sin carreras guardadas|Aucune carrière sauvegardée|Keine gespeicherten Karrieren|Nessuna carriera salvata|Geen opgeslagen carrières|Brak zapisanych karier|Нет сохранённых карьер|Kayıtlı kariyer yok|لا توجد مسيرات محفوظة|没有已保存的生涯|保存されたキャリアはありません|저장된 커리어 없음|कोई सहेजा करियर नहीं|Tidak ada karier tersimpan|Inga sparade karriärer");
  A("Classificação","Standings|Clasificación|Classement|Tabelle|Classifica|Stand|Tabela|Таблица|Puan durumu|الترتيب|积分榜|順位表|순위|तालिका|Klasemen|Tabell");
  A("Equipa","Team|Equipo|Équipe|Team|Squadra|Team|Drużyna|Команда|Takım|الفريق|队伍|チーム|팀|टीम|Tim|Lag");
  A("Jogador","Player|Jugador|Joueur|Spieler|Giocatore|Speler|Gracz|Игрок|Oyuncu|اللاعب|选手|プレイヤー|선수|खिलाड़ी|Pemain|Spelare");
  A("País","Country|País|Pays|Land|Paese|Land|Kraj|Страна|Ülke|البلد|国家|国|국가|देश|Negara|Land");
  A("Região","Region|Región|Région|Region|Regione|Regio|Region|Регион|Bölge|المنطقة|地区|地域|지역|क्षेत्र|Wilayah|Region");
  A("Pontos","Points|Puntos|Points|Punkte|Punti|Punten|Punkty|Очки|Puan|النقاط|积分|ポイント|포인트|अंक|Poin|Poäng");
  A("Divisão","Division|División|Division|Division|Divisione|Divisie|Dywizja|Дивизион|Lig|القسم|分段|ディビジョン|디비전|डिवीजन|Divisi|Division");
  A("Modo","Mode|Modo|Mode|Modus|Modalità|Modus|Tryb|Режим|Mod|الوضع|模式|モード|모드|मोड|Mode|Läge");
  A("Posição","Position|Posición|Position|Position|Posizione|Positie|Pozycja|Позиция|Sıra|المركز|排名|順位|순위|स्थान|Posisi|Placering");
  A("Jogos","Games|Partidas|Parties|Spiele|Partite|Wedstrijden|Mecze|Игры|Maçlar|المباريات|场次|試合|경기|मैच|Pertandingan|Matcher");
  A("APOSENTADO","RETIRED|RETIRADO|RETRAITÉ|ZURÜCKGETRETEN|RITIRATO|GESTOPT|EMERYT|ЗАВЕРШИЛ|EMEKLİ|معتزل|已退役|引退|은퇴|संन्यासी|PENSIUN|AVSLUTAD");
  A("Fácil","Easy|Fácil|Facile|Leicht|Facile|Makkelijk|Łatwy|Легко|Kolay|سهل|简单|簡単|쉬움|आसान|Mudah|Lätt");
  A("Normal","Normal|Normal|Normal|Normal|Normale|Normaal|Normalny|Нормально|Normal|عادي|普通|ノーマル|보통|सामान्य|Normal|Normal");
  A("Difícil","Hard|Difícil|Difficile|Schwer|Difficile|Moeilijk|Trudny|Сложно|Zor|صعب|困难|難しい|어려움|कठिन|Sulit|Svår");
  A("Época {0} · Semana {1}","Season {0} · Week {1}|Temporada {0} · Semana {1}|Saison {0} · Semaine {1}|Saison {0} · Woche {1}|Stagione {0} · Settimana {1}|Seizoen {0} · Week {1}|Sezon {0} · Tydzień {1}|Сезон {0} · Неделя {1}|Sezon {0} · Hafta {1}|الموسم {0} · الأسبوع {1}|第{0}赛季 · 第{1}周|シーズン{0} · {1}週目|시즌 {0} · {1}주차|सीज़न {0} · सप्ताह {1}|Musim {0} · Minggu {1}|Säsong {0} · Vecka {1}");
  A("ÉPOCA {0}","SEASON {0}|TEMPORADA {0}|SAISON {0}|SAISON {0}|STAGIONE {0}|SEIZOEN {0}|SEZON {0}|СЕЗОН {0}|SEZON {0}|الموسم {0}|第{0}赛季|シーズン{0}|시즌 {0}|सीज़न {0}|MUSIM {0}|SÄSONG {0}");
  A("{0} EQUIPAS","{0} TEAMS|{0} EQUIPOS|{0} ÉQUIPES|{0} TEAMS|{0} SQUADRE|{0} TEAMS|{0} DRUŻYN|{0} КОМАНД|{0} TAKIM|{0} فرق|{0} 支队伍|{0}チーム|{0}개 팀|{0} टीमें|{0} TIM|{0} LAG");

  const FULL_CODES=new Set(FULL.map(x=>x[0]));
  const RTL=new Set(["ar","he","fa","ur","ps","sd","yi"]);
  const ATTRS=["placeholder","title","aria-label","alt"];
  const SKIP=new Set(["SCRIPT","STYLE","TEXTAREA","CANVAS","CODE"]);
  const orig=new WeakMap(),shown=new WeakMap();
  let lang="pt",observer=null,busy=false;

  function key(code){return ORDER.includes(code)?code:"en";}
  function tr(text){
    if(lang==="pt") return text;
    const k=key(lang),trimmed=text.trim();
    if(!trimmed) return text;
    const lead=text.slice(0,text.indexOf(trimmed)),tail=text.slice(text.indexOf(trimmed)+trimmed.length);
    const hit=core=>{
      const e=DICT.get(core);if(e) return e[k];
      for(const [re,m] of TEMPLATES){const r=re.exec(core);if(r){let s=m[k];r.slice(1).forEach((v,i)=>s=s.replace("{"+i+"}",v));return s;}}
      return null;
    };
    let out=hit(trimmed);
    if(out===null){
      const pre=/^[^\p{L}\p{N}]*/u.exec(trimmed)[0],suf=/[^\p{L}\p{N}.!?]*$/u.exec(trimmed.slice(pre.length))[0];
      const core=trimmed.slice(pre.length,trimmed.length-suf.length);
      if(core&&(pre||suf)){const r=hit(core);if(r!==null) out=pre+r+suf;}
    }
    return out===null?text:lead+out+tail;
  }
  function textNode(n){
    if(n.parentElement&&(SKIP.has(n.parentElement.tagName)||n.parentElement.closest("[data-notr]"))) return;
    let o=orig.get(n);
    if(o===undefined||n.nodeValue!==shown.get(n)){o=n.nodeValue;orig.set(n,o);}
    const t=tr(o);shown.set(n,t);
    if(n.nodeValue!==t) n.nodeValue=t;
  }
  function attrs(el){
    if(el.closest&&el.closest("[data-notr]")) return;
    for(const a of ATTRS){
      if(!el.hasAttribute(a)) continue;
      const id=a,store=orig.get(el)||{},cur=el.getAttribute(a);
      if(store[id]===undefined||cur!==store[id+"_t"]){store[id]=cur;}
      const t=tr(store[id]);store[id+"_t"]=t;orig.set(el,store);
      if(cur!==t) el.setAttribute(a,t);
    }
  }
  function walk(root){
    if(root.nodeType===3){textNode(root);return;}
    if(root.nodeType!==1) return;
    if(SKIP.has(root.tagName)) return;
    attrs(root);
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    let n;while((n=w.nextNode())){if(n.nodeType===3)textNode(n);else if(!SKIP.has(n.tagName))attrs(n);}
  }
  function run(root){busy=true;try{walk(root);}finally{busy=false;}}
  function start(){
    if(observer) return;
    observer=new MutationObserver(list=>{
      if(busy||lang==="pt"&&!list.length) return;
      busy=true;
      try{
        for(const m of list){
          if(m.type==="characterData") textNode(m.target);
          else if(m.type==="attributes") attrs(m.target);
          else m.addedNodes.forEach(walk);
        }
      }finally{busy=false;}
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  }
  function setLang(code){
    lang=code||"pt";
    document.documentElement.lang=lang;
    document.documentElement.dir=RTL.has(lang)?"rtl":"ltr";
    run(document.body);
    start();
  }
  function optionsHTML(sel){
    const o=(c,n)=>`<option value="${c}" ${sel===c?"selected":""}>${n}</option>`;
    return FULL.map(([c,n])=>o(c,n)).join("")+`<optgroup label="Interface em inglês (tradução em curso)">${PARTIAL.map(([c,n])=>o(c,n)).join("")}</optgroup>`;
  }
  window.RLMI18N={setLang,optionsHTML,get lang(){return lang;},fullCodes:FULL_CODES};
})();
