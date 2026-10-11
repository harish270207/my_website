
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsHHyCSJ1XMNvq7-JTzLhF3ldktfmgEAE",
  authDomain: "nptel-13222.firebaseapp.com",
  projectId: "nptel-13222",
  storageBucket: "nptel-13222.firebasestorage.app",
  messagingSenderId: "100479387468",
  appId: "1:100479387468:web:aa05137aa3c6e393fdf1e9",
  measurementId: "G-3VSMZVLPRH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const colleges = [
  "Swarnandhra College of Engineering and Technology, Narsapur",
  "Sri Vasavi Engineering College, Tadepalligudem",
  "Sasi Institute of Technology and Engineering, Tadepalligudem",
  "Shri Vishnu Engineering College for Women, Bhimavaram",
  "Vishnu Institute of Technology, Bhimavaram",
  "Sagi Ramakrishnam Raju Engineering College, Bhimavaram",
  "Andhra University College of Engineering, Visakhapatnam",
  "JNTU-GV College of Engineering, Vizianagaram",
  "JNTUK University College of Engineering, Kakinada",
  "University College of Engineering, JNTUK, Narasaraopet",
  "Acharya Nagarjuna University College of Engineering, Guntur",
  "RVR and JC College of Engineering, Guntur",
  "V R Siddhartha Engineering College, Vijayawada",
  "DVR and Dr HS MIC College of Technology, Kanchikacherla",
  "NRI Institute of Technology, Pothavarappadu",
  "Usha Rama College of Engineering and Technology, Telaprolu",
  "QIS College of Engineering and Technology, Ongole",
  "Pace Institute of Technology and Sciences, Ongole",
  "Prasad V Potluri Siddhartha Institute of Technology, Vijayawada",
  "GMR Institute of Technology, Rajam",
  "Aditya Engineering College, Surampalem",
  "Raghu Engineering College, Visakhapatnam",
  "Gayatri Vidya Parishad College of Engineering, Visakhapatnam",
  "Lendi Institute of Engineering and Technology, Vizianagaram",
  "Velagapudi Ramakrishna Siddhartha Engineering College, Vijayawada",
  "Anil Neerukonda Institute of Technology and Sciences, Visakhapatnam",
  "K L University, Vaddeswaram",
  "Vignan's Foundation for Science, Technology and Research, Vadlamudi",
  "Sri Venkateswara University College of Engineering, Tirupati",
  "Sree Vidyanikethan Engineering College, Tirupati",
  "Madanapalle Institute of Technology and Science, Madanapalle",
  "G Pulla Reddy Engineering College, Kurnool",
  "Raghu Institute of Technology, Visakhapatnam",
  "Chalapathi Institute of Engineering and Technology, Guntur"
];

const collegeList = document.getElementById("collegeList");

colleges.sort().forEach(name => {
  const option = document.createElement("option");
  option.value = name;
  collegeList.appendChild(option);
});

const form = document.getElementById("studentForm");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");
const loginStatus = document.getElementById("loginStatus");
const tableStatus = document.getElementById("tableStatus");
const studentTable = document.getElementById("studentTable");

let unsubscribe = null;
let currentUser = null;

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    loginStatus.textContent = "Sign-in failed: " + error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    loginStatus.textContent = "Sign-out failed.";
  }
});

function showStudents() {
  if (unsubscribe) unsubscribe();

  tableStatus.textContent = "Loading details...";
  studentTable.replaceChildren();

  unsubscribe = onSnapshot(
    collection(db, "students"),
    snapshot => {
      studentTable.replaceChildren();

      const students = snapshot.docs.map(doc => doc.data());

      students.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );

      students.forEach(student => {
        const row = document.createElement("tr");

        [
          student.name,
          student.college,
          student.district,
          student.session
        ].forEach(value => {
          const cell = document.createElement("td");
          cell.textContent = value || "";
          row.appendChild(cell);
        });

        studentTable.appendChild(row);
      });

      tableStatus.textContent =
        students.length + " student record(s) found.";
    },
    error => {
      tableStatus.textContent =
        "Could not load details. Check your Firestore rules.";
      console.error(error);
    }
  );
}

onAuthStateChanged(auth, user => {
  currentUser = user;
  loginBtn.hidden = !!user;
  logoutBtn.hidden = !user;
  form.hidden = !user;

  if (user) {
    loginStatus.textContent = "Signed in as " + user.email;
    showStudents();
  } else {
    loginStatus.textContent = "Sign in with Google to continue.";
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    studentTable.replaceChildren();
    tableStatus.textContent = "Sign in to view class details.";
  }
});

document.getElementById("refreshBtn").addEventListener("click", () => {
  if (currentUser) showStudents();
  else tableStatus.textContent = "Please sign in first.";
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) {
    message.textContent = "Please sign in first.";
    return;
  }

  const name = document.getElementById("name").value.trim();
  const college = document.getElementById("college").value.trim();
  const district = document.getElementById("district").value.trim();
  const session = document.getElementById("session").value;
  const consent = document.getElementById("consent").checked;

  if (!name || !district || !consent) {
    message.textContent = "Fill all fields and accept the consent.";
    return;
  }

  if (!["Morning", "Evening"].includes(session)) {
    message.textContent = "Choose a valid session.";
    return;
  }

  submitBtn.disabled = true;
  message.textContent = "Saving details...";

  try {
    await addDoc(collection(db, "students"), {
      name,
      college,
      district,
      session,
      consent: true,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    });

    message.textContent = "Details saved successfully!";
    form.reset();
  } catch (error) {
    console.error(error);
    message.textContent =
      "Could not save details. Please check Firebase setup and rules.";
  } finally {
    submitBtn.disabled = false;
  }
});




document.getElementById("getStarted").addEventListener("click", () => {
  document.getElementById("welcomePage").hidden = true;
  document.getElementById("examApp").hidden = false;
  window.scrollTo(0, 0);
});
