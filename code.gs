/**
 * =========================================================================
 * CBT SMA NEGERI 1 KUTOWINANGUN - GOOGLE APPS SCRIPT BACKEND (code.gs)
 * High Security Mobile CBT & Multi-Paket Engine (1 Guru = 1 Mapel Mandiri)
 * Terintegrasi Analisis Butir Soal, Acak Soal/Opsi, Fast Sync (< 5s) & Realtime Sync
 * =========================================================================
 */

// ID Google Spreadsheet Sistem & Users (Akun Pengguna, Mapel, Rekap Nilai, Cheat Logs)
const SHEET_SYSTEM_ID = "1nD60VMcGXeEED5JJVVzZAbU7BmkyIOE7EZtHEnsUkac";

// ID Google Spreadsheet Bank Soal & Hasil Pengerjaan Siswa (Questions & Lembar Jawaban)
const SHEET_SOAL_ID   = "14Iy4Y18ITNtWciKrhQIFd2o_aq9KW1ARKxwV2HqE8KU";

/**
 * Inisialisasi struktur tab dan header resmi pada Google Spreadsheet
 */
function setupDatabase() {
  try {
    // 1. SPREADSHEET SISTEM & AKUN PENGGUNA
    const ssSystem = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
    
    // Tab USERS: Struktur akun guru, siswa, dan admin
    getOrCreateSheet(ssSystem, "USERS", ["ID_NIS_NIP", "NAME", "ROLE", "CLASS", "DEVICE_ID"]);

    // Tab SUBJECTS: Pengaturan mata pelajaran, token, durasi & acak per paket
    getOrCreateSheet(ssSystem, "SUBJECTS", [
      "ID", "NAME", "TEACHER_NIP", "TOKEN", "DURATION_MIN", 
      "FINALIZED_PACKAGES", "PUBLISHED_PACKAGES", 
      "PACKAGE_TOKENS_JSON", "PACKAGES_LIST_JSON", "PACKAGE_DURATIONS_JSON", "PACKAGE_RANDOMIZE_JSON"
    ]);

    // Tab RESULTS: Rekapitulasi nilai akhir dan status ujian siswa
    getOrCreateSheet(ssSystem, "RESULTS", [
      "NIS", "NAME", "CLASS", "SUBJECT", "PACKAGE", "SCORE_PG", "TOTAL_SCORE", "STATUS", "SUBMITTED_AT"
    ]);

    // Tab CHEAT_LOGS: Pencatatan rekaman insiden pelanggaran anti-cheat
    getOrCreateSheet(ssSystem, "CHEAT_LOGS", [
      "TIMESTAMP", "NIS", "NAME", "SUBJECT", "VIOLATION_TYPE", "COUNT", "STATUS"
    ]);

    // 2. SPREADSHEET BANK SOAL & LEMBAR JAWABAN SISWA
    const ssSoal = SpreadsheetApp.openById(SHEET_SOAL_ID);
    
    // Tab QUESTIONS: Butir soal objektif multi-paket
    getOrCreateSheet(ssSoal, "QUESTIONS", [
      "ID", "SUBJECT_ID", "PACKAGE", "TYPE", "TEXT", "AUDIO", "IMAGE", "OPTIONS_JSON", "CORRECT_KEY_JSON", "WEIGHT"
    ]);

    // Tab STUDENT_ANSWERS: Lembar respon pengerjaan siswa realtime & final
    getOrCreateSheet(ssSoal, "STUDENT_ANSWERS", [
      "NIS", "NAME", "CLASS", "SUBJECT_ID", "SUBJECT_NAME", "PACKAGE", "ANSWERS_JSON", "SUBMITTED_AT"
    ]);

    Logger.log("DATABASE CBT BERHASIL DIINISIALISASI.");
    return { status: "success", message: "Struktur database CBT SMAN 1 Kutowinangun siap digunakan." };
  } catch (err) {
    Logger.log("Error Setup Database: " + err.toString());
    return { status: "error", message: err.toString() };
  }
}

/**
 * Handler HTTP GET untuk verifikasi status koneksi Web App
 */
function doGet(e) {
  return createJsonResponse({
    status: "success",
    message: "CBT SMA Negeri 1 Kutowinangun API Web App Active."
  });
}

/**
 * Handler HTTP POST utama untuk router aksi antarmuka
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const payload = requestData.payload || {};
    let responseData = { status: "error", message: "Aksi tidak dikenali: " + action };

    switch (action) {
      // 1. Endpoint Penarikan Cepat (< 5 Detik) & Pengaturan Acak
      case "getTeacherDashboardData":
        responseData = handleGetTeacherDashboardData(payload);
        break;
      case "savePackageRandomize":
        responseData = handleSavePackageRandomize(payload);
        break;

      // 2. Endpoint Autentikasi & Sinkronisasi
      case "setupDatabase":
        responseData = setupDatabase();
        break;
      case "syncAllData":
        responseData = handleSyncAllData(payload);
        break;
      case "login":
        responseData = handleLogin(payload);
        break;

      // 3. Endpoint Mata Pelajaran & Paket Soal
      case "getSubjects":
        responseData = handleGetSubjects();
        break;
      case "savePackageToken":
        responseData = handleSavePackageToken(payload);
        break;
      case "toggleFinalize":
        responseData = handleToggleFinalize(payload);
        break;
      case "togglePublish":
        responseData = handleTogglePublish(payload);
        break;

      // 4. Endpoint Bank Soal
      case "getQuestions":
        responseData = handleGetQuestions(payload);
        break;
      case "saveQuestionsBatch":
        responseData = handleSaveQuestionsBatch(payload);
        break;
      case "deleteQuestion":
        responseData = handleDeleteQuestion(payload);
        break;

      // 5. Endpoint Pengerjaan Ujian Siswa
      case "submitExam":
        responseData = handleSubmitExam(payload);
        break;
      case "autoSaveExamProgress":
        responseData = handleAutoSaveExamProgress(payload);
        break;
      case "getStudentAnswers":
        responseData = handleGetStudentAnswers(payload);
        break;
      case "getResults":
        responseData = handleGetResults();
        break;

      // 6. Endpoint Keamanan & Kontrol Kecurangan
      case "logViolation":
        responseData = handleLogViolation(payload);
        break;
      case "resetViolations":
        responseData = handleResetViolations(payload);
        break;
      case "deleteCheatLog":
        responseData = handleDeleteCheatLog(payload);
        break;
      case "clearCheatLogs":
        responseData = handleClearCheatLogs();
        break;
      case "getCheatLogs":
        responseData = handleGetCheatLogs();
        break;
      case "unbindDevice":
        responseData = handleUnbindDevice(payload);
        break;
      case "unbindAllDevices":
        responseData = handleUnbindAllDevices();
        break;

      // 7. Endpoint Manajemen Pengguna
      case "getUsers":
        responseData = handleGetUsers();
        break;
      case "addUser":
        responseData = handleAddUser(payload);
        break;
      case "importUsersBatch":
        responseData = handleImportUsersBatch(payload);
        break;
      case "deleteUser":
        responseData = handleDeleteUser(payload);
        break;

      default:
        responseData = { status: "error", message: "Invalid action: " + action };
    }

    return createJsonResponse(responseData);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Pengambilan data Guru super cepat (< 5 detik)
 * Mengumpulkan Bank Soal, Rekap Nilai, dan Lembar Jawaban dalam 1 kali round-trip
 */
function handleGetTeacherDashboardData(payload) {
  try {
    const subjectId = payload.subjectId;
    const pkg = payload.package || "A";

    const ssSystem = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
    const ssSoal = SpreadsheetApp.openById(SHEET_SOAL_ID);

    // 1. Ambil Butir Soal Terkait
    const questions = handleGetQuestions({ subjectId: subjectId, package: pkg }).data || [];

    // 2. Ambil Rekap Nilai Siswa
    const sheetResults = getOrCreateSheet(ssSystem, "RESULTS", ["NIS", "NAME", "CLASS", "SUBJECT", "PACKAGE", "SCORE_PG", "TOTAL_SCORE", "STATUS", "SUBMITTED_AT"]);
    const resultsData = sheetResults.getDataRange().getValues();
    const results = [];
    for (let i = 1; i < resultsData.length; i++) {
      results.push({
        rowIdx: i + 1,
        nis: resultsData[i][0],
        name: resultsData[i][1],
        class: resultsData[i][2],
        subject: resultsData[i][3],
        package: resultsData[i][4],
        scorePG: Number(resultsData[i][5]),
        totalScore: Number(resultsData[i][6]),
        status: resultsData[i][7],
        submittedAt: resultsData[i][8]
      });
    }

    // 3. Ambil Peta Lembar Jawaban Siswa
    const sheetAnswers = getOrCreateSheet(ssSoal, "STUDENT_ANSWERS", ["NIS", "NAME", "CLASS", "SUBJECT_ID", "SUBJECT_NAME", "PACKAGE", "ANSWERS_JSON", "SUBMITTED_AT"]);
    const answersData = sheetAnswers.getDataRange().getValues();
    const answersMap = {};

    for (let j = 1; j < answersData.length; j++) {
      const uNis = String(answersData[j][0]).trim();
      const uSub = String(answersData[j][4]).trim();
      const uPkg = String(answersData[j][5]).trim();
      const key = `${uNis}_${uSub}_${uPkg}`;

      try {
        answersMap[key] = answersData[j][6] ? JSON.parse(answersData[j][6]) : {};
      } catch (e) {
        answersMap[key] = {};
      }
    }

    return {
      status: "success",
      data: {
        questions: questions,
        results: results,
        answersMap: answersMap
      }
    };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

/**
 * Menyimpan konfigurasi status acak soal dan acak opsi per paket
 */
function handleSavePackageRandomize(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "SUBJECTS", [
    "ID", "NAME", "TEACHER_NIP", "TOKEN", "DURATION_MIN", 
    "FINALIZED_PACKAGES", "PUBLISHED_PACKAGES", 
    "PACKAGE_TOKENS_JSON", "PACKAGES_LIST_JSON", "PACKAGE_DURATIONS_JSON", "PACKAGE_RANDOMIZE_JSON"
  ]);
  const data = sheet.getDataRange().getValues();
  const subjectId = payload.subjectId;
  const pkg = payload.package;
  const randQ = payload.randomizeQuestions !== false;
  const randOpt = payload.randomizeOptions !== false;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(subjectId)) {
      let randObj = {};
      try { randObj = data[i][10] ? JSON.parse(data[i][10]) : {}; } catch (e) {}
      randObj[pkg] = { questions: randQ, options: randOpt };
      sheet.getRange(i + 1, 11).setValue(JSON.stringify(randObj));
      return { status: "success", message: `Pengaturan acak Paket ${pkg} disimpan.` };
    }
  }

  return { status: "error", message: "Mata pelajaran tidak ditemukan." };
}

/**
 * Sinkronisasi data Google Sheets ke memori aplikasi
 */
function handleSyncAllData(payload) {
  try {
    const target = payload.target || "ALL";
    const result = {};

    if (target === "ALL" || target === "USERS") {
      result.users = handleGetUsers().data;
    }
    if (target === "ALL" || target === "SUBJECTS") {
      result.subjects = handleGetSubjects().data;
    }
    if (target === "ALL" || target === "QUESTIONS") {
      result.questions = handleGetQuestions({}).data;
    }
    if (target === "ALL" || target === "RESULTS") {
      result.results = handleGetResults().data;
      result.cheatLogs = handleGetCheatLogs().data;
    }

    return {
      status: "success",
      message: "Sinkronisasi Google Sheets selesai.",
      data: result
    };
  } catch (err) {
    return {
      status: "error",
      message: "Gagal menyinkronkan data: " + err.toString()
    };
  }
}

/**
 * Autentikasi user dan validasi penguncian gawai (Device Binding)
 */
function handleLogin(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "USERS", ["ID_NIS_NIP", "NAME", "ROLE", "CLASS", "DEVICE_ID"]);
  const data = sheet.getDataRange().getValues();
  const inputId = String(payload.id).trim();
  const deviceId = payload.deviceId;

  for (let i = 1; i < data.length; i++) {
    const idCell = String(data[i][0]).trim();
    if (idCell === inputId) {
      const user = {
        id: data[i][0],
        name: data[i][1],
        role: data[i][2],
        class: data[i][3],
        deviceId: data[i][4]
      };

      if (user.role === 'student') user.nis = user.id;
      if (user.role === 'teacher') {
        user.nip = user.id;
        user.subjectId = "SUB-" + user.id;
        const sheetSub = getOrCreateSheet(ss, "SUBJECTS", ["ID", "NAME", "TEACHER_NIP"]);
        const subData = sheetSub.getDataRange().getValues();
        for (let j = 1; j < subData.length; j++) {
          if (String(subData[j][2]) === String(user.nip) || String(subData[j][0]) === user.subjectId) {
            user.subjectId = subData[j][0];
            user.subject = subData[j][1];
            break;
          }
        }
      }

      // Validasi Device Lock untuk Siswa
      if (user.role === 'student') {
        if (!user.deviceId || user.deviceId === "") {
          sheet.getRange(i + 1, 5).setValue(deviceId);
          user.deviceId = deviceId;
        } else if (user.deviceId !== deviceId) {
          return {
            status: "error",
            message: "Akun ini terkunci pada HP lain! Hubungi Administrator untuk Unbind HP."
          };
        }
      }

      return { status: "success", data: user };
    }
  }

  return { status: "error", message: "ID / NIS / NIP tidak terdaftar dalam database sekolah!" };
}

/**
 * Mengambil daftar user guru dan siswa
 */
function handleGetUsers() {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "USERS", ["ID_NIS_NIP", "NAME", "ROLE", "CLASS", "DEVICE_ID"]);
  const sheetSub = getOrCreateSheet(ss, "SUBJECTS", ["ID", "NAME", "TEACHER_NIP"]);
  const data = sheet.getDataRange().getValues();
  const subData = sheetSub.getDataRange().getValues();
  
  const subMap = {};
  for (let j = 1; j < subData.length; j++) {
    subMap[String(subData[j][2])] = subData[j][1];
  }

  const users = [];
  for (let i = 1; i < data.length; i++) {
    const role = data[i][2];
    const uId = String(data[i][0]);
    users.push({
      id: uId,
      name: data[i][1],
      role: role,
      class: data[i][3],
      subject: role === 'teacher' ? (subMap[uId] || 'Mapel') : '',
      deviceId: data[i][4] || null
    });
  }

  return { status: "success", data: users };
}

/**
 * Menambahkan user baru secara manual (1 Guru = 1 Mapel Mandiri)
 */
function handleAddUser(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "USERS", ["ID_NIS_NIP", "NAME", "ROLE", "CLASS", "DEVICE_ID"]);
  const data = sheet.getDataRange().getValues();
  const idInput = String(payload.id).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idInput) {
      return { status: "error", message: `ID / NIS / NIP ${idInput} sudah terdaftar!` };
    }
  }

  sheet.appendRow([idInput, payload.name, payload.role, payload.class || "-", ""]);

  if (payload.role === 'teacher' && payload.subjectName) {
    const sheetSub = getOrCreateSheet(ss, "SUBJECTS", [
      "ID", "NAME", "TEACHER_NIP", "TOKEN", "DURATION_MIN", 
      "FINALIZED_PACKAGES", "PUBLISHED_PACKAGES", 
      "PACKAGE_TOKENS_JSON", "PACKAGES_LIST_JSON", "PACKAGE_DURATIONS_JSON", "PACKAGE_RANDOMIZE_JSON"
    ]);
    const subId = "SUB-" + idInput;
    sheetSub.appendRow([
      subId,
      payload.subjectName,
      idInput,
      "TOK" + Math.floor(100 + Math.random() * 900),
      60,
      "",
      "",
      JSON.stringify({ "A": "PAK" + Math.floor(100 + Math.random() * 900), "B": "PBK" + Math.floor(100 + Math.random() * 900), "C": "PCK" + Math.floor(100 + Math.random() * 900) }),
      JSON.stringify(["A", "B", "C"]),
      JSON.stringify({ "A": 60, "B": 60, "C": 60 }),
      JSON.stringify({ "A": { "questions": true, "options": true }, "B": { "questions": false, "options": false } })
    ]);
  }

  return { status: "success", message: `User ${payload.name} berhasil ditambahkan.` };
}

/**
 * Impor massal data pengguna dari Excel
 */
function handleImportUsersBatch(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "USERS", ["ID_NIS_NIP", "NAME", "ROLE", "CLASS", "DEVICE_ID"]);
  const sheetSub = getOrCreateSheet(ss, "SUBJECTS", [
    "ID", "NAME", "TEACHER_NIP", "TOKEN", "DURATION_MIN", 
    "FINALIZED_PACKAGES", "PUBLISHED_PACKAGES", 
    "PACKAGE_TOKENS_JSON", "PACKAGES_LIST_JSON", "PACKAGE_DURATIONS_JSON", "PACKAGE_RANDOMIZE_JSON"
  ]);
  
  const existingUsers = sheet.getDataRange().getValues().map(r => String(r[0]).trim());
  const users = payload.users || [];
  let addedCount = 0;

  users.forEach(u => {
    const uId = String(u.id || u.nis || u.nip).trim();
    if (uId && !existingUsers.includes(uId)) {
      sheet.appendRow([uId, u.name, u.role || "student", u.class || "-", ""]);
      existingUsers.push(uId);
      addedCount++;

      if (u.role === 'teacher' && u.subjectName) {
        sheetSub.appendRow([
          "SUB-" + uId,
          u.subjectName,
          uId,
          "TOK" + Math.floor(100 + Math.random() * 900),
          60,
          "",
          "",
          JSON.stringify({ "A": "PAK" + Math.floor(100 + Math.random() * 900), "B": "PBK" + Math.floor(100 + Math.random() * 900), "C": "PCK" + Math.floor(100 + Math.random() * 900) }),
          JSON.stringify(["A", "B", "C"]),
          JSON.stringify({ "A": 60, "B": 60, "C": 60 }),
          JSON.stringify({ "A": { "questions": true, "options": true } })
        ]);
      }
    }
  });

  return { status: "success", message: `Berhasil mengimpor ${addedCount} pengguna.` };
}

/**
 * Menghapus akun pengguna dan mata pelajaran terkait
 */
function handleDeleteUser(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "USERS", ["ID_NIS_NIP", "NAME", "ROLE", "CLASS", "DEVICE_ID"]);
  const sheetSub = getOrCreateSheet(ss, "SUBJECTS", ["ID", "NAME", "TEACHER_NIP"]);
  const data = sheet.getDataRange().getValues();
  const targetId = String(payload.id).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === targetId) {
      sheet.deleteRow(i + 1);
      const subData = sheetSub.getDataRange().getValues();
      for (let j = subData.length - 1; j >= 1; j--) {
        if (String(subData[j][2]) === targetId || String(subData[j][0]) === ("SUB-" + targetId)) {
          sheetSub.deleteRow(j + 1);
        }
      }
      return { status: "success", message: `User ID ${targetId} berhasil dihapus.` };
    }
  }

  return { status: "error", message: "User tidak ditemukan." };
}

/**
 * Mengambil daftar mata pelajaran, paket, token, dan durasi
 */
function handleGetSubjects() {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "SUBJECTS", [
    "ID", "NAME", "TEACHER_NIP", "TOKEN", "DURATION_MIN", 
    "FINALIZED_PACKAGES", "PUBLISHED_PACKAGES", 
    "PACKAGE_TOKENS_JSON", "PACKAGES_LIST_JSON", "PACKAGE_DURATIONS_JSON", "PACKAGE_RANDOMIZE_JSON"
  ]);
  const data = sheet.getDataRange().getValues();
  const subjects = [];

  for (let i = 1; i < data.length; i++) {
    let packageTokens = { "A": data[i][3] || "TOK123", "B": "PBK123", "C": "PCK123" };
    let packages = ["A", "B", "C"];
    let packageDurations = { "A": Number(data[i][4] || 60), "B": Number(data[i][4] || 60), "C": Number(data[i][4] || 60) };
    let packageRandomize = { "A": { questions: true, options: true }, "B": { questions: false, options: false } };

    if (data[i][7]) {
      try { packageTokens = { ...packageTokens, ...JSON.parse(data[i][7]) }; } catch (e) {}
    }
    if (data[i][8]) {
      try { packages = JSON.parse(data[i][8]); } catch (e) {}
    }
    if (data[i][9]) {
      try { packageDurations = { ...packageDurations, ...JSON.parse(data[i][9]) }; } catch (e) {}
    }
    if (data[i][10]) {
      try { packageRandomize = { ...packageRandomize, ...JSON.parse(data[i][10]) }; } catch (e) {}
    }

    subjects.push({
      id: data[i][0],
      name: data[i][1],
      teacherNip: String(data[i][2]),
      token: data[i][3],
      packages: packages,
      packageTokens: packageTokens,
      packageDurations: packageDurations,
      packageRandomize: packageRandomize,
      durationMin: Number(data[i][4] || 60),
      finalizedPackages: data[i][5] ? String(data[i][5]).split(",") : [],
      publishedPackages: data[i][6] ? String(data[i][6]).split(",") : []
    });
  }

  return { status: "success", data: subjects };
}

/**
 * Menyimpan konfigurasi token dan durasi per paket
 */
function handleSavePackageToken(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "SUBJECTS", [
    "ID", "NAME", "TEACHER_NIP", "TOKEN", "DURATION_MIN", 
    "FINALIZED_PACKAGES", "PUBLISHED_PACKAGES", 
    "PACKAGE_TOKENS_JSON", "PACKAGES_LIST_JSON", "PACKAGE_DURATIONS_JSON", "PACKAGE_RANDOMIZE_JSON"
  ]);
  const data = sheet.getDataRange().getValues();
  
  const subjectId = payload.subjectId;
  const pkg = payload.package;
  const token = payload.token;
  const durationMin = payload.durationMin;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(subjectId)) {
      let tokensObj = {};
      let durationsObj = {};
      try { tokensObj = data[i][7] ? JSON.parse(data[i][7]) : {}; } catch (e) {}
      try { durationsObj = data[i][9] ? JSON.parse(data[i][9]) : {}; } catch (e) {}

      tokensObj[pkg] = token;
      if (durationMin) durationsObj[pkg] = Number(durationMin);
      
      sheet.getRange(i + 1, 8).setValue(JSON.stringify(tokensObj));
      if (durationMin) sheet.getRange(i + 1, 10).setValue(JSON.stringify(durationsObj));

      if (pkg === 'A' || !data[i][3]) {
        sheet.getRange(i + 1, 4).setValue(token);
      }
      return { status: "success", message: `Pengaturan Paket ${pkg} disimpan.` };
    }
  }

  return { status: "error", message: "Mata pelajaran tidak ditemukan." };
}

/**
 * Toggle status finalisasi paket oleh Guru
 */
function handleToggleFinalize(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "SUBJECTS", [
    "ID", "NAME", "TEACHER_NIP", "TOKEN", "DURATION_MIN", 
    "FINALIZED_PACKAGES", "PUBLISHED_PACKAGES", 
    "PACKAGE_TOKENS_JSON", "PACKAGES_LIST_JSON", "PACKAGE_DURATIONS_JSON", "PACKAGE_RANDOMIZE_JSON"
  ]);
  const data = sheet.getDataRange().getValues();
  const subjectId = payload.subjectId;
  const pkg = payload.package;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(subjectId)) {
      let finArr = data[i][5] ? String(data[i][5]).split(",") : [];
      const idx = finArr.indexOf(pkg);
      if (idx >= 0) finArr.splice(idx, 1);
      else finArr.push(pkg);
      
      sheet.getRange(i + 1, 6).setValue(finArr.join(","));
      return { status: "success", finalizedPackages: finArr };
    }
  }

  return { status: "error", message: "Mapel tidak ditemukan." };
}

/**
 * Toggle status publikasi paket oleh Administrator
 */
function handleTogglePublish(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "SUBJECTS", [
    "ID", "NAME", "TEACHER_NIP", "TOKEN", "DURATION_MIN", 
    "FINALIZED_PACKAGES", "PUBLISHED_PACKAGES", 
    "PACKAGE_TOKENS_JSON", "PACKAGES_LIST_JSON", "PACKAGE_DURATIONS_JSON", "PACKAGE_RANDOMIZE_JSON"
  ]);
  const data = sheet.getDataRange().getValues();
  const subjectId = payload.subjectId;
  const pkg = payload.package;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(subjectId)) {
      let pubArr = data[i][6] ? String(data[i][6]).split(",") : [];
      const idx = pubArr.indexOf(pkg);
      if (idx >= 0) pubArr.splice(idx, 1);
      else pubArr.push(pkg);
      
      sheet.getRange(i + 1, 7).setValue(pubArr.join(","));
      return { status: "success", publishedPackages: pubArr };
    }
  }

  return { status: "error", message: "Mapel tidak ditemukan." };
}

/**
 * Mengambil butir soal dari Sheet Bank Soal
 */
function handleGetQuestions(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SOAL_ID);
  const sheet = getOrCreateSheet(ss, "QUESTIONS", [
    "ID", "SUBJECT_ID", "PACKAGE", "TYPE", "TEXT", "AUDIO", "IMAGE", "OPTIONS_JSON", "CORRECT_KEY_JSON", "WEIGHT"
  ]);
  const data = sheet.getDataRange().getValues();
  const subjectId = payload.subjectId;
  const pkg = payload.package;
  const questions = [];

  for (let i = 1; i < data.length; i++) {
    const rowSubId = String(data[i][1]);
    const rowPkg = String(data[i][2]);

    if ((!subjectId || rowSubId === String(subjectId)) && (!pkg || rowPkg === String(pkg))) {
      let parsedOptions = null;
      let parsedOptionImages = null;
      let parsedStatements = null;
      let parsedCorrectKey = null;

      try {
        let rawOpts = data[i][7] ? JSON.parse(data[i][7]) : null;
        if (rawOpts && !Array.isArray(rawOpts) && typeof rawOpts === 'object') {
          parsedOptions = rawOpts.options || null;
          parsedOptionImages = rawOpts.optionImages || null;
        } else {
          parsedOptions = rawOpts;
        }
      } catch (e) {}

      try {
        parsedCorrectKey = data[i][8] ? JSON.parse(data[i][8]) : data[i][8];
      } catch (e) {
        parsedCorrectKey = data[i][8];
      }

      if (data[i][3] === 'BS' && Array.isArray(parsedOptions) && !parsedOptions.includes('BENAR')) {
        parsedStatements = parsedOptions;
      }

      questions.push({
        id: data[i][0],
        subjectId: data[i][1],
        package: data[i][2],
        type: data[i][3],
        text: data[i][4],
        audio: data[i][5] || null,
        image: data[i][6] || null,
        options: parsedOptions,
        optionImages: parsedOptionImages,
        statements: parsedStatements,
        items: data[i][3] === 'URUTAN' && parsedOptions ? parsedOptions : null,
        pairs: data[i][3] === 'JODOH' && parsedOptions ? parsedOptions : null,
        correctKey: data[i][3] === 'PG' ? Number(data[i][8]) : parsedCorrectKey,
        correctKeys: data[i][3] === 'PGK' ? (Array.isArray(parsedCorrectKey) ? parsedCorrectKey : []) : null,
        correctOrder: data[i][3] === 'URUTAN' ? (Array.isArray(parsedCorrectKey) ? parsedCorrectKey : []) : null,
        weight: Number(data[i][9] || 20)
      });
    }
  }

  return { status: "success", data: questions };
}

/**
 * Menyimpan sekumpulan butir soal secara serempak
 */
function handleSaveQuestionsBatch(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SOAL_ID);
  const sheet = getOrCreateSheet(ss, "QUESTIONS", [
    "ID", "SUBJECT_ID", "PACKAGE", "TYPE", "TEXT", "AUDIO", "IMAGE", "OPTIONS_JSON", "CORRECT_KEY_JSON", "WEIGHT"
  ]);
  
  const subjectId = payload.subjectId;
  const pkg = payload.package;
  const questions = payload.questions || [];

  questions.forEach(q => {
    let optionsJson = "";
    let correctKeyJson = "";

    if (q.type === 'PG' || q.type === 'PGK') {
      let optionsData = q.options || [];
      if (q.optionImages && Array.isArray(q.optionImages) && q.optionImages.some(img => img)) {
        optionsData = { options: q.options || [], optionImages: q.optionImages };
      }
      optionsJson = JSON.stringify(optionsData);
      correctKeyJson = q.type === 'PG' ? q.correctKey : JSON.stringify(q.correctKeys || []);
    } else if (q.type === 'BS') {
      optionsJson = JSON.stringify(q.statements || q.options || ['BENAR', 'SALAH']);
      correctKeyJson = typeof q.correctKey === 'object' ? JSON.stringify(q.correctKey) : String(q.correctKey || 'BENAR');
    } else if (q.type === 'URUTAN') {
      optionsJson = JSON.stringify(q.items || []);
      correctKeyJson = JSON.stringify(q.correctOrder || []);
    } else if (q.type === 'JODOH') {
      optionsJson = JSON.stringify(q.pairs || []);
      correctKeyJson = JSON.stringify(q.pairs || []);
    }

    sheet.appendRow([
      q.id || ('Q_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
      subjectId,
      pkg,
      q.type,
      q.text,
      "",
      q.image || "",
      optionsJson,
      correctKeyJson,
      q.weight || 20
    ]);
  });

  return { status: "success", message: `${questions.length} Soal berhasil disimpan ke Database.` };
}

/**
 * Menghapus butir soal berdasarkan ID
 */
function handleDeleteQuestion(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SOAL_ID);
  const sheet = getOrCreateSheet(ss, "QUESTIONS", [
    "ID", "SUBJECT_ID", "PACKAGE", "TYPE", "TEXT", "AUDIO", "IMAGE", "OPTIONS_JSON", "CORRECT_KEY_JSON", "WEIGHT"
  ]);
  const data = sheet.getDataRange().getValues();
  const qId = payload.questionId;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(qId)) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Soal berhasil dihapus." };
    }
  }

  return { status: "error", message: "ID Soal tidak ditemukan." };
}

/**
 * Menyimpan hasil pengerjaan siswa dan lembar jawaban utuh
 */
function handleSubmitExam(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "RESULTS", [
    "NIS", "NAME", "CLASS", "SUBJECT", "PACKAGE", "SCORE_PG", "TOTAL_SCORE", "STATUS", "SUBMITTED_AT"
  ]);
  
  const res = payload.result;
  const timeNow = new Date().toLocaleTimeString();

  sheet.appendRow([
    res.nis,
    res.name,
    res.class || "-",
    res.subject,
    res.package,
    res.scorePG,
    res.totalScore,
    res.status || "Selesai",
    timeNow
  ]);

  try {
    const ssSoal = SpreadsheetApp.openById(SHEET_SOAL_ID);
    const sheetAnswers = getOrCreateSheet(ssSoal, "STUDENT_ANSWERS", [
      "NIS", "NAME", "CLASS", "SUBJECT_ID", "SUBJECT_NAME", "PACKAGE", "ANSWERS_JSON", "SUBMITTED_AT"
    ]);
    sheetAnswers.appendRow([
      res.nis,
      res.name,
      res.class || "-",
      res.subjectId || "",
      res.subject,
      res.package,
      JSON.stringify(res.userAnswers || {}),
      timeNow
    ]);
  } catch (err) {
    Logger.log("Error Menyimpan Lembar Jawaban Siswa: " + err.toString());
  }

  return { status: "success", message: "Hasil Ujian dan Jawaban tersimpan ke Server." };
}

/**
 * Menyimpan progres pengerjaan lembar jawaban siswa secara realtime (interval 15 detik)
 */
function handleAutoSaveExamProgress(payload) {
  try {
    const ssSoal = SpreadsheetApp.openById(SHEET_SOAL_ID);
    const sheetAnswers = getOrCreateSheet(ssSoal, "STUDENT_ANSWERS", [
      "NIS", "NAME", "CLASS", "SUBJECT_ID", "SUBJECT_NAME", "PACKAGE", "ANSWERS_JSON", "SUBMITTED_AT"
    ]);
    const data = sheetAnswers.getDataRange().getValues();
    const nis = String(payload.nis || "").trim();
    const subName = String(payload.subject || "").trim();
    const pkg = String(payload.package || "A").trim();
    const answersJson = JSON.stringify(payload.userAnswers || {});
    const nowTime = new Date().toLocaleTimeString();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === nis && String(data[i][4]).trim() === subName && String(data[i][5]).trim() === pkg) {
        sheetAnswers.getRange(i + 1, 7).setValue(answersJson);
        sheetAnswers.getRange(i + 1, 8).setValue(nowTime + " (Auto-Save)");
        return { status: "success", message: "Progres jawaban otomatis diperbarui." };
      }
    }

    sheetAnswers.appendRow([
      nis,
      payload.name || "-",
      payload.class || "-",
      payload.subjectId || "",
      subName,
      pkg,
      answersJson,
      nowTime + " (Auto-Save)"
    ]);

    return { status: "success", message: "Progres jawaban baru tersimpan realtime." };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

/**
 * Mengambil lembar jawaban siswa untuk pemeriksaan oleh Guru
 */
function handleGetStudentAnswers(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SOAL_ID);
  const sheet = getOrCreateSheet(ss, "STUDENT_ANSWERS", [
    "NIS", "NAME", "CLASS", "SUBJECT_ID", "SUBJECT_NAME", "PACKAGE", "ANSWERS_JSON", "SUBMITTED_AT"
  ]);
  const data = sheet.getDataRange().getValues();
  const nisTarget = String(payload.nis || "").trim();
  const subjectTarget = String(payload.subject || "").trim();
  const answersList = [];

  for (let i = 1; i < data.length; i++) {
    const rowNis = String(data[i][0]).trim();
    const rowSub = String(data[i][4]).trim();

    if ((!nisTarget || rowNis === nisTarget) && (!subjectTarget || rowSub.includes(subjectTarget) || subjectTarget.includes(rowSub))) {
      let answersObj = {};
      try {
        answersObj = data[i][6] ? JSON.parse(data[i][6]) : {};
      } catch (e) {}

      answersList.push({
        nis: data[i][0],
        name: data[i][1],
        class: data[i][2],
        subjectId: data[i][3],
        subjectName: data[i][4],
        package: data[i][5],
        userAnswers: answersObj,
        submittedAt: data[i][7]
      });
    }
  }

  return { status: "success", data: answersList };
}

/**
 * Mengambil rekapitulasi nilai ujian
 */
function handleGetResults() {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "RESULTS", [
    "NIS", "NAME", "CLASS", "SUBJECT", "PACKAGE", "SCORE_PG", "TOTAL_SCORE", "STATUS", "SUBMITTED_AT"
  ]);
  const data = sheet.getDataRange().getValues();
  const results = [];

  for (let i = 1; i < data.length; i++) {
    results.push({
      rowIdx: i + 1,
      nis: data[i][0],
      name: data[i][1],
      class: data[i][2],
      subject: data[i][3],
      package: data[i][4],
      scorePG: Number(data[i][5]),
      totalScore: Number(data[i][6]),
      status: data[i][7],
      submittedAt: data[i][8]
    });
  }

  return { status: "success", data: results };
}

/**
 * Mencatat pelanggaran kecurangan siswa ke CHEAT_LOGS
 */
function handleLogViolation(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "CHEAT_LOGS", [
    "TIMESTAMP", "NIS", "NAME", "SUBJECT", "VIOLATION_TYPE", "COUNT", "STATUS"
  ]);
  
  const log = payload.log;
  sheet.appendRow([
    new Date().toLocaleTimeString(),
    log.nis,
    log.name,
    log.subject,
    log.violationType,
    log.count,
    log.status
  ]);

  return { status: "success" };
}

/**
 * Mengambil riwayat pelanggaran kecurangan
 */
function handleGetCheatLogs() {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "CHEAT_LOGS", [
    "TIMESTAMP", "NIS", "NAME", "SUBJECT", "VIOLATION_TYPE", "COUNT", "STATUS"
  ]);
  const data = sheet.getDataRange().getValues();
  const logs = [];

  for (let i = 1; i < data.length; i++) {
    logs.push({
      timestamp: data[i][0],
      nis: data[i][1],
      name: data[i][2],
      subject: data[i][3],
      violationType: data[i][4],
      count: data[i][5],
      status: data[i][6]
    });
  }

  return { status: "success", data: logs };
}

/**
 * Reset pelanggaran siswa oleh Administrator
 */
function handleResetViolations(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "CHEAT_LOGS", [
    "TIMESTAMP", "NIS", "NAME", "SUBJECT", "VIOLATION_TYPE", "COUNT", "STATUS"
  ]);
  const data = sheet.getDataRange().getValues();
  const nis = payload.nis;

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === String(nis)) {
      sheet.deleteRow(i + 1);
    }
  }

  return { status: "success", message: `Pelanggaran NIS: ${nis} telah di-reset.` };
}

/**
 * Menghapus satu log pelanggaran berdasarkan timestamp dan NIS
 */
function handleDeleteCheatLog(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "CHEAT_LOGS", [
    "TIMESTAMP", "NIS", "NAME", "SUBJECT", "VIOLATION_TYPE", "COUNT", "STATUS"
  ]);
  const data = sheet.getDataRange().getValues();
  const nis = String(payload.nis || "").trim();
  const timestamp = String(payload.timestamp || "").trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === nis && (!timestamp || String(data[i][0]).trim() === timestamp)) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Catatan pelanggaran berhasil dihapus." };
    }
  }

  return { status: "error", message: "Data pelanggaran tidak ditemukan." };
}

/**
 * Menghapus seluruh rekaman log pelanggaran kecurangan (Clear All Cheat Logs)
 */
function handleClearCheatLogs() {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "CHEAT_LOGS", [
    "TIMESTAMP", "NIS", "NAME", "SUBJECT", "VIOLATION_TYPE", "COUNT", "STATUS"
  ]);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  return { status: "success", message: "Seluruh data kecurangan berhasil dibersihkan." };
}

/**
 * Melepas ikatan gawai tunggal (Unbind Device)
 */
function handleUnbindDevice(payload) {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "USERS", ["ID_NIS_NIP", "NAME", "ROLE", "CLASS", "DEVICE_ID"]);
  const data = sheet.getDataRange().getValues();
  const nis = payload.nis;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(nis)) {
      sheet.getRange(i + 1, 5).setValue("");
      return { status: "success", message: `Device Lock NIS ${nis} berhasil dilepas.` };
    }
  }

  return { status: "error", message: "Siswa tidak ditemukan." };
}

/**
 * Melepas ikatan seluruh gawai siswa secara serentak (ALL UNBIND)
 */
function handleUnbindAllDevices() {
  const ss = SpreadsheetApp.openById(SHEET_SYSTEM_ID);
  const sheet = getOrCreateSheet(ss, "USERS", ["ID_NIS_NIP", "NAME", "ROLE", "CLASS", "DEVICE_ID"]);
  const data = sheet.getDataRange().getValues();
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i][4] && String(data[i][4]).trim() !== "") {
      sheet.getRange(i + 1, 5).setValue("");
      count++;
    }
  }

  return { status: "success", message: `Berhasil mereset kaitan ${count} perangkat siswa secara massal.` };
}

/**
 * Helper: Membuka tab sheet atau membuat baru jika belum ada
 */
function getOrCreateSheet(ss, sheetName, defaultHeaders) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(defaultHeaders);
  }
  return sheet;
}

/**
 * Helper: Membungkus output response JSON standar Google Apps Script
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
