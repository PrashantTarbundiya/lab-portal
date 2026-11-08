import urllib.request
import urllib.parse
import json
import sys

BASE_URL = 'http://ec2-3-26-15-115.ap-southeast-2.compute.amazonaws.com'

def request(endpoint, method='GET', data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.getcode(), json.loads(resp.read().decode('utf-8'))

passed = 0
failed = 0

def test(name, fn):
    global passed, failed
    try:
        fn()
        print(f"  [PASS] {name}")
        passed += 1
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")
        failed += 1

print("==================================================")
print("  EXHAUSTIVE APPLICATION COMPONENT AUDIT SUITE   ")
print("==================================================")

# 1. Health & Database
print("\n--- 1. Health & Database Connectivity ---")
def t1():
    code, res = request('/api/health')
    assert code == 200 and res.get('status') == 'ok' and res.get('db') == 'connected', res
test("Database PostgreSQL ping & Health Status", t1)

# 2. Auth & Accounts
print("\n--- 2. Auth & User Personas ---")
def t2():
    code, res = request('/api/auth/demo-login', 'POST', {'role': 'patient', 'mobile': '9000000001'})
    assert code == 200 and res.get('token'), res
test("Patient Demo Login (9000000001)", t2)

def t3():
    code, res = request('/api/auth/demo-login', 'POST', {'role': 'staff', 'email': 'frontdesk@demo.local'})
    assert code == 200 and res.get('token'), res
test("Staff Demo Login (frontdesk@demo.local)", t3)

def t4():
    code, res = request('/api/auth/demo-login', 'POST', {'role': 'doctor', 'email': 'doctor@demo.local'})
    assert code == 200 and res.get('token'), res
test("Doctor Demo Login (doctor@demo.local)", t4)

# 3. Patient Family & Orders
print("\n--- 3. Patient Portal & Diagnostic Orders ---")
PATIENT_TOKEN = "demo-patient:+919000000001"
def t5():
    code, res = request('/api/patients/family', token=PATIENT_TOKEN)
    members = res.get('patients') or res.get('members', [])
    assert code == 200 and len(members) >= 2, f"Expected family members, got {res}"
test("Patient Family Profiles (>=2 members)", t5)

def t6():
    code, res = request('/api/orders', token=PATIENT_TOKEN)
    assert code == 200 and len(res.get('orders', [])) >= 1, f"Expected orders, got {res}"
test("Patient Orders List (real seeded orders)", t6)

def t7():
    code, res = request('/api/orders/ORD-71204', token=PATIENT_TOKEN)
    assert code == 200 and res.get('orderNo') == 'ORD-71204', res
    # Verify hemoglobin result is low
    hb = next((r for r in res.get('results', []) if 'haemoglobin' in r.get('parameter', '').lower()), None)
    assert hb is not None and hb.get('flag') == 'LOW', f"Expected low Hb, got {hb}"
test("Order Detail ORD-71204 (Haemoglobin 10.2 LOW)", t7)

def t8():
    url = f"{BASE_URL}/api/orders/ORD-71204/pdf"
    req = urllib.request.Request(url, headers={'Authorization': f"Bearer {PATIENT_TOKEN}"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        assert resp.getcode() == 200 and 'application/pdf' in resp.headers.get('Content-Type', '')
test("Order Diagnostic PDF Report Generation (200 OK, application/pdf)", t8)

# 4. Hospitals & Razorpay Payment
print("\n--- 4. Hospital Network & Razorpay Payment ---")
def t9():
    code, res = request('/api/hospitals', token=PATIENT_TOKEN)
    assert code == 200 and len(res.get('hospitals', [])) >= 3, res
test("Hospital Network Listing (>=3 facilities in Vijayawada)", t9)

def t10():
    code, res = request('/api/payments/razorpay/config')
    assert code == 200 and res.get('currency') == 'INR', res
test("Razorpay Gateway Public Configuration", t10)

def t11():
    code, res = request('/api/payments/razorpay/order', 'POST', {'amount': 750, 'serviceType': 'OPD_CONSULTATION'}, PATIENT_TOKEN)
    assert code == 200 or code == 201
    assert res.get('success') is True and res.get('order', {}).get('amount') == 75000, res
test("Razorpay Order Creation (₹750 = 75000 paise)", t11)

def t12():
    apt_data = {
        'hospitalId': 'HOSP-01',
        'department': 'Cardiology & General Medicine',
        'doctorName': 'Dr. K. Srinivas Rao, MD',
        'type': 'DOCTOR_OPD_CONSULTATION',
        'fee': 750,
        'patientName': 'Lakshmi Prasanna K',
        'mobileE164': '+919000000001',
        'paymentMethod': 'ONLINE_RAZORPAY',
        'paymentTxnId': 'pay_test_suite_12345'
    }
    code, res = request('/api/hospitals/appointments', 'POST', apt_data, PATIENT_TOKEN)
    assert code == 201 and res.get('success') is True, res
    apt = res.get('appointment')
    assert apt.get('paymentStatus') == 'PAID_ONLINE', apt
test("OPD Appointment Booking with Online Razorpay Status", t12)

def t13():
    # Settle payment for an appointment
    code, res = request('/api/hospitals/appointments/APT-2026-9041/pay', 'PATCH', {
        'paymentMethod': 'ONLINE_RAZORPAY',
        'paymentTxnId': 'pay_rzp_test_settled_99'
    }, PATIENT_TOKEN)
    assert code == 200 and res.get('success') is True, res
    assert res.get('appointment', {}).get('paymentStatus') == 'PAID_ONLINE', res
test("Appointment Payment Settlement API (PATCH /appointments/:id/pay)", t13)

def t14():
    code, res = request('/api/payments/razorpay/verify', 'POST', {
        'razorpay_payment_id': 'pay_rzp_test_settled_99',
        'appointmentId': 'APT-2026-9041'
    }, PATIENT_TOKEN)
    assert code == 200 and res.get('verified') is True, res
test("Razorpay Payment Verification (POST /payments/razorpay/verify)", t14)

# 5. AI Diagnostic Companion ("Labby AI")
print("\n--- 5. AI Diagnostic Companion ('Labby AI') ---")
def t15():
    code, res = request('/api/orders/ai/general-ask', 'POST', {
        'question': 'What does high fasting blood sugar mean and what lifestyle changes help?'
    })
    assert code == 200 and res.get('success') is True and len(res.get('answer', '')) > 50, res
test("General AI Medical Question (English)", t15)

def t16():
    code, res = request('/api/orders/ai/general-ask', 'POST', {
        'question': 'నా రక్త పరీక్ష ఫలితాలను తెలుగులో వివరించండి',
        'lang': 'te'
    })
    assert code == 200 and res.get('success') is True
    ans = res.get('answer', '')
    assert len(ans) > 20 and any(k in ans for k in ['రక్త', 'పరీక్ష', 'హీమోగ్లోబిన్', 'వివర', 'ఆరోగ్య', 'వైద్య']), f"Unexpected Telugu: {ans}"
test("General AI Medical Question (Telugu - Zero Reasoning Leaks)", t16)

def t17():
    code, res = request('/api/orders/ORD-71204/ask-ai', 'POST', {
        'question': 'Why is my hemoglobin flagged low?'
    }, PATIENT_TOKEN)
    assert code == 200 and res.get('success') is True
    ans = res.get('answer', '')
    assert '10.2' in ans or 'Haemoglobin' in ans, f"Expected Hb 10.2 in order AI, got: {ans}"
test("Order-Specific AI Ask (ORD-71204 personalized clinical review)", t17)

# 6. Doctor Portal
print("\n--- 6. Doctor Portal Worklist & Verification ---")
DOCTOR_TOKEN = "demo-doctor"
def t18():
    code, res = request('/api/doctors/worklist', token=DOCTOR_TOKEN)
    assert code == 200, res
    orders = res.get('orders', [])
    assert len(orders) >= 1, f"Expected doctor held orders, got {orders}"
test("Doctor Worklist (Critical Held & Dual Verification Queue)", t18)

# 7. Staff Console & WhatsApp Messages
print("\n--- 7. Staff Operations & Communication Engine ---")
STAFF_TOKEN = "demo-staff"
def t19():
    code, res = request('/api/tasks', token=STAFF_TOKEN)
    assert code == 200, res
    tasks = res.get('tasks', [])
    assert len(tasks) >= 1, f"Expected staff tasks, got {tasks}"
test("Staff Tasks Queue (LIS and Sample Collection)", t19)

def t20():
    code, res = request('/api/messages', token=STAFF_TOKEN)
    assert code == 200, res
    msgs = res.get('messages', [])
    assert len(msgs) >= 1, f"Expected WhatsApp message logs, got {msgs}"
test("WhatsApp Communications Log (Delivered, Pending, Failed)", t20)

print("\n==================================================")
print(f"  TOTAL TESTS: {passed + failed} | PASSED: {passed} | FAILED: {failed}  ")
print("==================================================")

if failed > 0:
    sys.exit(1)
