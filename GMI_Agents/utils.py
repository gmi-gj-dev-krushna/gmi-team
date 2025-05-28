import os
import json
import re
from dotenv import load_dotenv
from crewai import Agent, LLM

load_dotenv()

LEVEL_TRANSFORMS = {
    "junior": {
        "role_prefix": "Junior",
        "goal_append": " Focus on learning, contributing to small features, and collaborating with mentors.",
        "backstory_intro": "You are an enthusiastic junior full stack developer, eager to learn and grow in a supportive environment.",
        "experience_replace": "1+ year experience"
    },
    "mid-level": {
        "role_prefix": "Mid-Level",
        "goal_append": " Take ownership of features, improve existing systems, and collaborate effectively within teams.",
        "backstory_intro": "You are a confident mid-level developer with solid experience across the stack and the ability to work independently.",
        "experience_replace": "3+ years experience"
    },
    "senior": {
        "role_prefix": "Senior",
        "goal_append": " Lead complex projects, mentor junior developers, and drive architectural decisions.",
        "backstory_intro": "You are a seasoned senior developer with extensive experience and a track record of delivering scalable solutions.",
        "experience_replace": "5+ years experience leading full-stack projects and AI systems"
    },
    "specialist": {
        "role_prefix": "Principal",
        "goal_append": " Define technical vision, lead innovation, and mentor across teams in your area of expertise.",
        "backstory_intro": "You are a domain expert and principal engineer known for strategic thinking and innovation in AI systems and scalable web platforms.",
        "experience_replace": "8+ years of domain expertise and technical leadership"
    }
}

def load_gmi_agents():
    with open("GMI_agents.json", "r") as f:
        return json.load(f)["agents"]

def create_agent(agent_name: str, level: str, llm_provider: str, llm_model: str, api_key: str = None):
    agents = load_gmi_agents()
    base_agent = next((a for a in agents if a.get("name", "").strip().lower() == agent_name.strip().lower()), None)

    if not base_agent:
        raise ValueError(f"Agent '{agent_name}' not found in GMI_agents.json")

    level = level.lower()
    transform = LEVEL_TRANSFORMS.get(level)
    if not transform:
        raise ValueError(f"Unsupported level '{level}'")

    base_role = base_agent["role"]
    role_parts = base_role.split(" ", 1)
    base_title = role_parts[-1] if len(role_parts) > 1 else base_role
    updated_role = f"{transform['role_prefix']} {base_title}"
    updated_goal = base_agent["goal"].rstrip(".") + "." + transform["goal_append"]

    raw_backstory = "\n".join(base_agent["backstory"]) if isinstance(base_agent["backstory"], list) else base_agent["backstory"]
    for level_keyword in LEVEL_TRANSFORMS:
        pattern = re.compile(rf"\b{level_keyword}\b", flags=re.IGNORECASE)
        raw_backstory = pattern.sub(transform['role_prefix'].lower(), raw_backstory)
    raw_backstory = re.sub(r"\d+\+?\s*year[s]?\s*experience", transform['experience_replace'], raw_backstory, flags=re.IGNORECASE)
    full_backstory = f"{transform['backstory_intro']}\n\n{raw_backstory.strip()}"

   
    if llm_provider == "gemini":
        llm = LLM(model=llm_model, gemini_api_key=api_key)
    elif llm_provider == "openai":
        llm = LLM(model=llm_model, openai_api_key=api_key)
    elif llm_provider == "groq":
        llm = LLM(model=llm_model, groq_api_key=api_key)
    elif llm_provider == "ollama":
        llm = LLM(model=llm_model, provider="ollama")  
    else:
        raise ValueError(f"Unsupported LLM provider: {llm_provider}")

    return Agent(
        name=base_agent["name"],
        role=updated_role,
        goal=updated_goal,
        backstory=full_backstory,
        llm=llm,
        verbose=base_agent.get("verbose", True),
        allow_delegation=True
    )
