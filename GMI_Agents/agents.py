from crewai import Agent,LLM

from tools.google_calendar_leave_tool import get_leave_today

from dotenv import load_dotenv
import os

load_dotenv()

llm = LLM(
    model="gemini/gemini-2.0-flash-exp",
    gemini_api_key=os.getenv("GEMINI_API_KEY")
)


leave_monitor = Agent(
    role="Leave Monitor",
    goal="Fetch today's leave information from the connected Google Calendar",
    backstory=(
        "You are a reliable and detail-oriented assistant that checks who is on leave each day. "
        "You connect to the official leave calendar and return today's leave entries using keyword-based filtering. "
        "Your data helps other agents and systems stay up to date with employee availability."
    ),
    tools=[get_leave_today],
    llm=llm,
    verbose=True
)