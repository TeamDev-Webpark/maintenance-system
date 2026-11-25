# Welcome to your Lovable project

## ระบบหลักและแผน PM

รัน `npm run dev` แล้วเปิด [https://localhost:8080/](https://localhost:8080/) เลือก **ผู้วางแผน PM** แล้วเข้าด้วยบัญชีเดโม `pm` และรหัสผ่าน `demo1234`

- แผนปี 2569 แสดงรอบตาม Master Plan และตารางนัดอ้างอิงของเดือนมกราคมและกุมภาพันธ์ ผู้วางแผนกำหนดวันนัด ผู้รับผิดชอบ และบันทึกผลได้
- ทะเบียนเครื่องจักรเชื่อมกับแผน PM และใบแจ้งซ่อม ทะเบียนบุคลากรใช้เลือกผู้รับผิดชอบและเปิดดูได้ในหน้าจัดการผู้ใช้
- ข้อมูลตรวจนับอยู่ในคลังอะไหล่ แบบตรวจ AIR JET FILTER เปิดได้จากเมนู PM และเมนูเช็คชีทของ Admin

การแก้แผนและการบันทึก AIR JET FILTER เก็บในเบราว์เซอร์ที่ใช้งาน บัญชีเดโมใช้ตามบทบาทของระบบ ส่วนรายชื่อจาก Excel ใช้เป็นทะเบียนอ้างอิง

### เช็กชีทและแจ้งเตือน PM

เปิด **เช็กชีท PM → สร้าง Template** เพื่อกำหนดหัวข้อ คอลัมน์ รอบตรวจรายชั่วโมง รายวัน หรือรายกะ และเกณฑ์ตัวเลขขั้นต่ำ–สูงสุด เลือก Template ในรายละเอียดงาน PM แล้วกรอกผลจากรายการงานใต้ปฏิทิน ผลที่เกินเกณฑ์หรือเลือก **ไม่ผ่าน** จะเปิดใบแจ้งซ่อมหนึ่งใบต่อผลตรวจและแสดงใน **แจ้งเตือน PM** ประวัติผลตรวจเก็บชื่อคอลัมน์กับเกณฑ์ที่ใช้ขณะกรอก

Template ผลตรวจ การอ่านแจ้งเตือน และสถานะใบแจ้งซ่อมที่สร้างจาก PM เก็บในเบราว์เซอร์ของเครื่องที่ใช้งาน

#### อีเมลเคสด่วนและวิกฤต

ระบบส่งอีเมลผ่าน Resend เมื่อบันทึกผลนอกเกณฑ์จาก Template ที่ตั้งระดับ **ด่วน** หรือ **วิกฤต** สำหรับการใช้งานผ่าน Vite Dev หรือ Preview บนเครื่องหรือเครือข่ายภายใน ให้ตั้งตัวแปรฝั่งเซิร์ฟเวอร์ใน `.env.local` แล้วเริ่มเซิร์ฟเวอร์ใหม่

```dotenv
PM_EMAIL_API_KEY=
PM_EMAIL_FROM=
PM_EMAIL_TO=
PM_EMAIL_ALLOWED_ORIGIN=https://localhost:8080
```

`PM_EMAIL_FROM` ใช้ที่อยู่ผู้ส่งที่ยืนยันกับ Resend แล้ว `PM_EMAIL_TO` ใส่ผู้รับทีมซ่อมบำรุง โดยคั่นแต่ละอีเมลด้วยจุลภาค `PM_EMAIL_ALLOWED_ORIGIN` ใช้ต้นทางที่เปิดในเบราว์เซอร์ให้ตรงทั้งโปรโตคอล โฮสต์ และพอร์ต ผลตรวจจะบันทึกได้ทันทีและรายการที่ส่งไม่สำเร็จจะมีปุ่มส่งใหม่ในกล่องแจ้งเตือน [เอกสาร Resend สำหรับส่งอีเมล](https://resend.com/docs/api-reference/emails/send-email)

## President Flour Mills demo

Run `npm run dev:president` and open [http://127.0.0.1:8081/](http://127.0.0.1:8081/).
The separate production build is available through `npm run build:president`.
See [demo data and workflow](president-demo/README.md).

## Run in HTTPS (for camera/QR scanning)

Use one of these commands:

- `npm run dev` (now uses HTTPS via Vite config)
- `npm run dev:https`
- `npm run dev:https:lan` (for mobile testing on same network)

Notes:

- Browser may show a certificate warning on first open because this is a local dev certificate.
- Camera access requires HTTPS or localhost.
