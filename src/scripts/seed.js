require("dotenv").config();
const { connectDB, db } = require("../config/db");
const tutors = [
  ["Ayesha Rahman","Mathematics","https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80","Sun - Thu","5:00 PM - 8:00 PM",900,12,"BUET graduate · 5 years of teaching experience","Dhanmondi, Dhaka","Both"],
  ["Nafis Ahmed","Physics","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80","Sat - Wed","6:00 PM - 9:00 PM",1000,8,"University of Dhaka · Physics mentor for 4 years","Uttara, Dhaka","Online"],
  ["Sumaiya Karim","English","https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80","Sun - Fri","4:00 PM - 7:00 PM",750,10,"English language trainer · IELTS and academic writing","Mirpur, Dhaka","Both"],
  ["Fahim Chowdhury","ICT","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80","Fri - Tue","7:00 PM - 10:00 PM",1200,7,"Software engineer · Programming instructor for 6 years","Banani, Dhaka","Online"],
  ["Tasnia Islam","Chemistry","https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80","Sun - Thu","3:00 PM - 6:00 PM",850,9,"Chemistry lecturer · 5 years classroom experience","Mohammadpur, Dhaka","Offline"],
  ["Rafiul Hasan","Accounting","https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80","Sat - Thu","6:30 PM - 9:30 PM",800,11,"BBA & MBA · Accounting tutor for college students","Bashundhara, Dhaka","Both"],
  ["Nabila Sultana","Biology","https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80","Sun - Wed","5:30 PM - 8:30 PM",950,6,"Medical student · Biology and admission coaching","Farmgate, Dhaka","Online"],
  ["Mahin Kabir","Bangla","https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=800&q=80","Fri - Tue","4:30 PM - 7:30 PM",650,14,"Bangla literature graduate · 7 years of tutoring","Wari, Dhaka","Offline"]
];
(async()=>{
  await connectDB();
  const col=db().collection("tutors");
  const count=await col.countDocuments();
  if(count){ console.log(`Seed skipped: ${count} tutors already exist.`); process.exit(0); }
  const now=Date.now();
  await col.insertMany(tutors.map((t,i)=>({
    tutorName:t[0],subject:t[1],photo:t[2],availableDays:t[3],availableTimeSlot:t[4],hourlyFee:t[5],totalSlot:t[6],institutionExperience:t[7],location:t[8],teachingMode:t[9],
    sessionStartDate:new Date(now - 86400000 + i*3600000), creatorEmail:"demo@mediqueue.dev", creatorName:"MediQueue Demo", createdAt:new Date(now - i*86400000), updatedAt:new Date()
  })));
  console.log("Inserted 8 MediQueue demo tutors."); process.exit(0);
})().catch(error=>{console.error(error);process.exit(1);});
