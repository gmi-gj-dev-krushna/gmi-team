import os
import datetime
import pickle
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from crewai.tools import tool


SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']


GM_CALENDAR_ID = 'c_e2c38c1589f8c6178334fa2977e75640cb237713b9f34ef3e8d26fcf2157d541@group.calendar.google.com'
# GM_CALENDAR_ID = 'gmi.tn.dev.vanbazhagan@gmail.com'



def authenticate_google_calendar():
    creds = None
    token_path = Path(__file__).parent / "token.pickle"
    credentials_path = Path(__file__).parent / "credentials.json"

    if token_path.exists():
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
            creds = flow.run_local_server(port=8000)

        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)

    return build('calendar', 'v3', credentials=creds)


def list_calendars():
    service = authenticate_google_calendar()
    calendar_list = service.calendarList().list().execute()
    print(" Your Google Calendars:\n")
    for calendar in calendar_list.get('items', []):
        print(f" Calendar Name: {calendar['summary']}")
        print(f" Calendar ID:   {calendar['id']}")
        print("-" * 50)


def get_leaves(timeframe='month', calendar_id=GM_CALENDAR_ID):
    service = authenticate_google_calendar()
    now = datetime.datetime.now(datetime.timezone.utc)

    if timeframe == 'today':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif timeframe == 'week':
        start = now - datetime.timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + datetime.timedelta(days=6, hours=23, minutes=59, seconds=59)
    else: 
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end = now.replace(year=now.year + 1, month=1, day=1) - datetime.timedelta(seconds=1)
        else:
            end = now.replace(month=now.month + 1, day=1) - datetime.timedelta(seconds=1)

    time_min = start.isoformat()
    time_max = end.isoformat()

    print(f" Fetching leave events for: {timeframe}")
    print(f" From: {time_min}")
    print(f"  To:   {time_max}")

    events_result = service.events().list(
        calendarId=calendar_id,
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    events = events_result.get('items', [])
    print(f" Total events fetched: {len(events)}")

    leave_keywords = ['leave', 'ooo', 'out of office', 'vacation', 'time off', 'pl', 'cl', 'sl', 'lop', 'hd']
    leave_people = []

    for event in events:
        summary = event.get('summary', '')
        if any(keyword in summary.lower() for keyword in leave_keywords):
            print(f" Matched leave event: {summary}")
            leave_people.append(summary)

    if not leave_people:
        return f"No one is on leave for {timeframe}."
    return f"People on leave ({timeframe}): {', '.join(set(leave_people))}"


@tool("get_leave_this_month")
def get_leave_this_month():
    """
    Tool: Get people on leave this month from the GM India calendar.
    """
    return get_leaves('month', GM_CALENDAR_ID)

@tool("get_leave_today")
def get_leave_today():
    """
    Tool: Get people on leave today from the GM India calendar.
    """
    return get_leaves('today', GM_CALENDAR_ID)

@tool("get_leave_this_week")
def get_leave_this_week():
    """
    Tool: Get people on leave this week from the GM India calendar.
    """
    return get_leaves('week', GM_CALENDAR_ID)


# def main():
#     print("🧭 STEP 1: Listing calendars (optional, already have correct one)")
#     list_calendars()

#     print("\n🧪 TESTING LEAVE FETCH FOR TODAY")
#     print(get_leaves('today', GM_CALENDAR_ID))

#     print("\n🧪 TESTING LEAVE FETCH FOR THIS WEEK")
#     print(get_leaves('week', GM_CALENDAR_ID))

#     print("\n🧪 TESTING LEAVE FETCH FOR THIS MONTH")
#     print(get_leaves('month', GM_CALENDAR_ID))


# if __name__ == "__main__":
#     main()
