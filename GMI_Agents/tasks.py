from crewai import Task
from agents import leave_monitor  

def create_today_leave_task():
    return Task(
        description=(
            "Use your access to Google Calendar to check who is on leave today. "
            "You should fetch today's events and filter for keywords such as "
            "'PL', 'CL', 'SL', 'LOP', 'Leave', 'HD', 'time off', etc. "
            "Only include events that clearly indicate someone is on leave."
        ),
        expected_output=(
            "A clean, comma-separated list or bullet point list of all people on leave today based on event summaries. "
             "with the leave type and name exactly as mentioned in the event summary.\n\n"
            "If no one is on leave, return 'No one is on leave today.'"
        ),
        agent=leave_monitor,
        output_file="output/leave-today"
    )
