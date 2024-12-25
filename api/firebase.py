import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Firebase configuration: Initialize Firebase Admin SDK
cred = credentials.Certificate("D:/code/nextjs/SIEM/siem-3f77b-firebase-adminsdk-1zbq3-0bd2d7685e.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Add a user
def add_user(user_uid, email, role):
    db.collection("users").document(user_uid).set({
        "email": email,
        "role": role
    })

# Add a log
def add_log(year, month, severity, message, source, log_type, additional_data=None):
    log_ref = db.collection("logs").document(year).collection(month).document()
    log_ref.set({
        "timestamp": datetime.now(),
        "severity": severity,
        "message": message,
        "source": source,
        "type": log_type,
        "additionalData": additional_data or {}
    })

# Add an alert
def add_alert(title, description, severity, status, related_log_id):
    alert_ref = db.collection("alerts").document()
    alert_ref.set({
        "title": title,
        "description": description,
        "severity": severity,
        "status": status,
        "timestamp": datetime.now(),
        "relatedLogId": related_log_id
    })

# Add an event
def add_event(event_type, source, severity, message, additional_data=None):
    event_ref = db.collection("events").document()
    event_ref.set({
        "type": event_type,
        "source": source,
        "severity": severity,
        "timestamp": datetime.now(),
        "message": message,
        "additionalData": additional_data or {}
    })

# Add threat intelligence
def add_threat_intelligence(threat_type, value, confidence, verified):
    ti_ref = db.collection("threatIntelligence").document()
    ti_ref.set({
        "type": threat_type,
        "value": value,  # Encrypt this value as needed
        "confidence": confidence,
        "verified": verified,
        "timestamp": datetime.now()
    })

# Add notification rule
def add_notification_rule(severity, email=None, push_notification=False):
    rule_ref = db.collection("notificationRules").document()
    rule_ref.set({
        "severity": severity,
        "email": email,
        "pushNotification": push_notification
    })

# Add a summary
def add_summary(date, critical_count, warning_count, info_count):
    summary_ref = db.collection("summaries").document(date)
    summary_ref.set({
        "date": date,
        "critical_count": critical_count,
        "warning_count": warning_count,
        "info_count": info_count
    })

# Add traffic data
def add_traffic(volume):
    traffic_ref = db.collection("traffic").document()
    traffic_ref.set({
        "timestamp": datetime.now(),
        "volume": volume
    })

# Example usage
if __name__ == "__main__":
    try:
        # Add a user
        add_user("user123", "user@example.com", "admin")

        # Add a log
        add_log(
            year="2024",
            month="12",
            severity="info",
            message="System initialized",
            source="system",
            log_type="startup"
        )

        # Add an alert
        add_alert(
            title="High CPU Usage",
            description="CPU usage exceeded 90%",
            severity="high",
            status="active",
            related_log_id="log123"
        )

        # Add an event
        add_event(
            event_type="security",
            source="firewall",
            severity="critical",
            message="Unauthorized access detected"
        )

        # Add threat intelligence
        add_threat_intelligence(
            threat_type="IP",
            value="192.168.1.1",
            confidence="high",
            verified=True
        )

        # Add a notification rule
        add_notification_rule(severity="critical", email="admin@example.com", push_notification=True)

        # Add a summary
        add_summary(date="2024-12-23", critical_count=5, warning_count=10, info_count=20)

        # Add traffic data
        add_traffic(volume=500)

        print("Data added successfully.")
    except Exception as e:
        print(f"Error adding data: {e}")
