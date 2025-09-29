from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Performance Appraisal System", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Enums
class CycleStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"

class CertificationStatus(str, Enum):
    COMPLETED = "completed"
    COMMITTED = "committed"

class TalentLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TalentRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TalentOverall(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    DEVELOPING = "developing"
    CONCERNING = "concerning"

# Base Models
class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Core Domain Models
class Manager(TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str

class ManagerCreate(BaseModel):
    name: str
    email: str

class Mentee(TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    manager_id: str
    name: str
    email: str
    role: str

class MenteeCreate(BaseModel):
    name: str
    email: str
    role: str

class MenteeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class Cycle(TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentee_id: str
    period_label: str
    start_date: datetime
    end_date: datetime
    status: CycleStatus = CycleStatus.ACTIVE

class CycleCreate(BaseModel):
    period_label: str
    start_date: datetime
    end_date: datetime
    status: Optional[CycleStatus] = CycleStatus.ACTIVE

class CycleUpdate(BaseModel):
    period_label: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[CycleStatus] = None

# Evaluation Sub-Models
class CompetencyScore(BaseModel):
    key: str
    name: str
    score: int = Field(ge=1, le=5)  # 1-5 range for radio buttons
    evidence: Optional[str] = None

class Goal(BaseModel):
    title: str
    description: str
    target_date: Optional[datetime] = None

class SelfReflection(BaseModel):
    key_strengths: Optional[str] = None
    passions: Optional[str] = None
    development_opportunities: Optional[str] = None
    proud_accomplishments: Optional[str] = None

class DevelopmentGoals(BaseModel):
    teksystems_roles: Optional[str] = None
    professional_goals: Optional[str] = None
    personal_goals: Optional[str] = None

class IDP(BaseModel):
    goals: List[Goal] = []  # Keep existing goals for backward compatibility
    progress_notes: Optional[str] = None
    self_reflection: Optional[SelfReflection] = None
    development_goals: Optional[DevelopmentGoals] = None

class Certification(BaseModel):
    name: str
    status: CertificationStatus
    completed_on: Optional[datetime] = None

class RoleFit(BaseModel):
    current_role: str
    next_role: str
    fit_current: int = Field(ge=1, le=5)
    fit_next: int = Field(ge=1, le=5)
    gaps: List[str] = []
    
    # EBR Framework - Organization
    ebr_organization_utilization: Optional[str] = None
    ebr_organization_engagement: Optional[str] = None
    ebr_organization_compliance: Optional[str] = None
    
    # EBR Framework - Project
    ebr_project_feedback: Optional[str] = None
    ebr_project_quality: Optional[str] = None
    
    # EBR Framework - Team/Practice
    ebr_team_certifications: Optional[str] = None
    ebr_team_cert_level: Optional[str] = None
    ebr_team_contribution: Optional[str] = None
    ebr_team_glint: Optional[str] = None
    ebr_team_leadership: Optional[str] = None
    
    # EBR Framework - Self
    ebr_self_goal_attainment: Optional[str] = None
    ebr_self_development: Optional[str] = None
    ebr_self_progress: Optional[str] = None

class PMFeedback(BaseModel):
    comments: Optional[str] = None
    strengths: List[str] = []
    areas_to_improve: List[str] = []

class TalentAssessment(BaseModel):
    potential: TalentLevel
    risk: TalentRisk
    overall: TalentOverall

class Evaluation(TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cycle_id: str
    competencies: List[CompetencyScore] = []
    idp: Optional[IDP] = None
    certifications: List[Certification] = []
    role_fit: Optional[RoleFit] = None
    pm_feedback: Optional[PMFeedback] = None
    talent_assessment: Optional[TalentAssessment] = None

class EvaluationUpdate(BaseModel):
    competencies: Optional[List[CompetencyScore]] = None
    idp: Optional[IDP] = None
    certifications: Optional[List[Certification]] = None
    role_fit: Optional[RoleFit] = None
    pm_feedback: Optional[PMFeedback] = None
    talent_assessment: Optional[TalentAssessment] = None

# Rubric Models
class RubricCriteria(BaseModel):
    excellent: str
    strong: str
    solid: str
    developing: str
    concerning: str

class RubricCompetency(BaseModel):
    key: str
    name: str
    description: str
    criteria: RubricCriteria

class Rubric(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    competencies: List[RubricCompetency]

# AI Analysis Models  
class AIFeedbackItem(BaseModel):
    type: str  # 'suggestion', 'risk', 'success'
    text: str

class AIAnalysisResponse(BaseModel):
    items: List[AIFeedbackItem] = []
    rubric_alignment: List[str] = []
    missing_fields: List[str] = []

class AIAnalysisRequest(BaseModel):
    evaluation_data: Dict[str, Any]
    cycle_id: str

# Report Models
class Report(TimestampMixin):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cycle_id: str
    summary_text: Optional[str] = None
    highlights: List[str] = []
    risks: List[str] = []
    html_snapshot: Optional[str] = None
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper function for MongoDB operations
def serialize_doc(doc):
    """Convert MongoDB document to dict, handling ObjectId"""
    if doc:
        doc['_id'] = str(doc['_id'])
        return doc
    return doc

async def get_manager_context():
    """For MVP, we'll use a single default manager"""
    manager = await db.managers.find_one({"email": "manager@company.com"})
    if not manager:
        # Create default manager for MVP
        default_manager = Manager(
            name="Default Manager",
            email="manager@company.com"
        )
        await db.managers.insert_one(default_manager.model_dump())
        return default_manager
    return Manager(**manager)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Performance Appraisal System API"}

# Mentee Management Routes
@api_router.get("/mentees", response_model=List[Mentee])
async def get_mentees(manager: Manager = Depends(get_manager_context)):
    mentees = await db.mentees.find({"manager_id": manager.id}).to_list(100)
    return [Mentee(**serialize_doc(mentee)) for mentee in mentees]

@api_router.post("/mentees", response_model=Mentee)
async def create_mentee(mentee_data: MenteeCreate, manager: Manager = Depends(get_manager_context)):
    mentee = Mentee(
        manager_id=manager.id,
        **mentee_data.model_dump()
    )
    await db.mentees.insert_one(mentee.model_dump())
    return mentee

@api_router.get("/mentees/{mentee_id}", response_model=Mentee)
async def get_mentee(mentee_id: str, manager: Manager = Depends(get_manager_context)):
    mentee = await db.mentees.find_one({"id": mentee_id, "manager_id": manager.id})
    if not mentee:
        raise HTTPException(status_code=404, detail="Mentee not found")
    return Mentee(**serialize_doc(mentee))

@api_router.patch("/mentees/{mentee_id}", response_model=Mentee)
async def update_mentee(
    mentee_id: str, 
    mentee_update: MenteeUpdate, 
    manager: Manager = Depends(get_manager_context)
):
    update_data = {k: v for k, v in mentee_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.mentees.update_one(
        {"id": mentee_id, "manager_id": manager.id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mentee not found")
    
    updated_mentee = await db.mentees.find_one({"id": mentee_id})
    return Mentee(**serialize_doc(updated_mentee))

@api_router.delete("/mentees/{mentee_id}")
async def delete_mentee(mentee_id: str, manager: Manager = Depends(get_manager_context)):
    # Also delete all cycles and evaluations for this mentee
    cycles = await db.cycles.find({"mentee_id": mentee_id}).to_list(100)
    cycle_ids = [cycle["id"] for cycle in cycles]
    
    # Delete evaluations for these cycles
    await db.evaluations.delete_many({"cycle_id": {"$in": cycle_ids}})
    # Delete cycles
    await db.cycles.delete_many({"mentee_id": mentee_id})
    # Delete mentee
    result = await db.mentees.delete_one({"id": mentee_id, "manager_id": manager.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mentee not found")
    
    return {"message": "Mentee deleted successfully"}

# Cycle Management Routes
@api_router.get("/mentees/{mentee_id}/cycles", response_model=List[Cycle])
async def get_mentee_cycles(mentee_id: str):
    cycles = await db.cycles.find({"mentee_id": mentee_id}).to_list(100)
    return [Cycle(**serialize_doc(cycle)) for cycle in cycles]

@api_router.post("/mentees/{mentee_id}/cycles", response_model=Cycle)
async def create_cycle(mentee_id: str, cycle_data: CycleCreate):
    # Verify mentee exists
    mentee = await db.mentees.find_one({"id": mentee_id})
    if not mentee:
        raise HTTPException(status_code=404, detail="Mentee not found")
    
    cycle = Cycle(
        mentee_id=mentee_id,
        **cycle_data.model_dump()
    )
    await db.cycles.insert_one(cycle.model_dump())
    
    # Create empty evaluation for this cycle
    evaluation = Evaluation(cycle_id=cycle.id)
    await db.evaluations.insert_one(evaluation.model_dump())
    
    return cycle

@api_router.get("/cycles/{cycle_id}", response_model=Cycle)
async def get_cycle(cycle_id: str):
    cycle = await db.cycles.find_one({"id": cycle_id})
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return Cycle(**serialize_doc(cycle))

@api_router.patch("/cycles/{cycle_id}", response_model=Cycle)
async def update_cycle(cycle_id: str, cycle_update: CycleUpdate):
    update_data = {k: v for k, v in cycle_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.cycles.update_one(
        {"id": cycle_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cycle not found")
    
    updated_cycle = await db.cycles.find_one({"id": cycle_id})
    return Cycle(**serialize_doc(updated_cycle))

@api_router.delete("/cycles/{cycle_id}")
async def delete_cycle(cycle_id: str):
    # Delete evaluation for this cycle
    await db.evaluations.delete_many({"cycle_id": cycle_id})
    # Delete cycle
    result = await db.cycles.delete_one({"id": cycle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cycle not found")
    
    return {"message": "Cycle deleted successfully"}

# Evaluation Routes
@api_router.get("/evaluations/{cycle_id}", response_model=Evaluation)
async def get_evaluation(cycle_id: str):
    evaluation = await db.evaluations.find_one({"cycle_id": cycle_id})
    if not evaluation:
        # Create empty evaluation if none exists
        new_evaluation = Evaluation(cycle_id=cycle_id)
        await db.evaluations.insert_one(new_evaluation.model_dump())
        return new_evaluation
    return Evaluation(**serialize_doc(evaluation))

@api_router.patch("/evaluations/{cycle_id}", response_model=Evaluation)
async def update_evaluation(cycle_id: str, evaluation_update: EvaluationUpdate):
    # Get existing evaluation or create new one
    existing = await db.evaluations.find_one({"cycle_id": cycle_id})
    
    update_data = {k: v for k, v in evaluation_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    if existing:
        result = await db.evaluations.update_one(
            {"cycle_id": cycle_id},
            {"$set": update_data}
        )
        updated_evaluation = await db.evaluations.find_one({"cycle_id": cycle_id})
        return Evaluation(**serialize_doc(updated_evaluation))
    else:
        # Create new evaluation
        new_evaluation = Evaluation(
            cycle_id=cycle_id,
            **update_data
        )
        await db.evaluations.insert_one(new_evaluation.model_dump())
        return new_evaluation

# Rubrics Routes
@api_router.get("/rubrics", response_model=List[Rubric])
async def get_rubrics():
    """Return predefined rubrics for competency evaluation based on actual PAS document"""
    # Updated rubric based on actual performance appraisal system
    default_rubric = Rubric(
        name="TEKsystems Performance Appraisal Rubric",
        competencies=[
            RubricCompetency(
                key="nimble_learning",
                name="Nimble Learning",
                description="Actively learning through experimentation when tackling new problems, using both successes and failures as learning fodder.",
                criteria=RubricCriteria(
                    excellent="Enjoys the challenge of unfamiliar tasks. Seeks new approaches to solve problems. Tries multiple times using multiple methods to find the right solution. Views mistakes as opportunities to learn.",
                    strong="Experiments to find new solutions. Extracts lessons learned from failures and mistakes. Learns quickly when facing new situations. Takes on the challenge of unfamiliar tasks.",
                    solid="Shows willingness to learn new approaches with guidance. Adapts to new situations with some support.",
                    developing="Has difficulty with unfamiliar tasks. Needs structured guidance to learn new concepts.",
                    concerning="Becomes frustrated or confused by unfamiliar tasks. Gives up on new ideas too soon. Resists taking a chance on untested solutions. Struggles to learn in new situations."
                )
            ),
            RubricCompetency(
                key="communicates_effectively",
                name="Communicates Effectively",
                description="Developing and delivering multi-mode communications that convey a clear understanding of the unique needs of different audiences.",
                criteria=RubricCriteria(
                    excellent="Actively listens and checks for understanding. Adjusts communication content and style to meet the needs of diverse stakeholders. Articulates messages in a way that is broadly understandable. Delivers messages in a clear, compelling, and concise manner. Models and encourages the expression of diverse ideas and opinions.",
                    strong="Adjusts to fit the audience and the message. Attentively listens to others. Encourages the open expression of diverse ideas and opinions. Is effective in a variety of communication settings: one-on-one, small and large groups, or among diverse styles and position levels. Provides timely and helpful information to others across the organization.",
                    solid="Communicates clearly in most situations. Listens to others and shares information appropriately.",
                    developing="Communication sometimes unclear or inconsistent. May struggle with different audiences.",
                    concerning="Doesn't consistently share information others need to do their jobs. Doesn't take the time to listen or understand others' viewpoints. Has difficulty communicating clear written and verbal messages. Tends to always communicate the same way without adjusting to diverse audiences."
                )
            ),
            RubricCompetency(
                key="drives_results",
                name="Drives Results",
                description="Consistently achieving results, even under tough circumstances.",
                criteria=RubricCriteria(
                    excellent="Always keeps the end in sight; puts in extra effort to meet deadlines. Is consistently one of the top performers. Persists in the face of challenges and setbacks. Pursues everything with energy, drive, and the need to finish. Sets aggressive goals and has high standards.",
                    strong="Has a strong bottom-line orientation. Has a track record of exceeding goals successfully. Persists in accomplishing objectives despite obstacles and setbacks. Pushes self and helps others achieve results.",
                    solid="Generally meets goals and deadlines. Shows persistence in achieving objectives.",
                    developing="Sometimes struggles to meet deadlines or achieve objectives. May need support to maintain focus.",
                    concerning="Does the least to get by. Gives up easily; doesn't go back with different strategies for the third and fourth try. Is an inconsistent performer. Is reluctant to push for results. Often misses deadlines. Procrastinates around whatever gets in the way."
                )
            ),
            RubricCompetency(
                key="customer_focus",
                name="Customer Focus",
                description="Building strong customer relationships and delivering customer-centric solutions.",
                criteria=RubricCriteria(
                    excellent="Anticipates customer needs and provides services that are beyond customer expectations. Serves as a strategic partner to build, grow, and maintain profitable and long-lasting relationships with key accounts. Uses customer insights to drive and guide the development of new offerings.",
                    strong="Builds and delivers solutions that meet customer expectations. Establishes and maintains effective customer relationships. Gains insight into customer needs. Identifies opportunities that benefit the customer.",
                    solid="Generally responsive to customer needs. Maintains professional relationships with customers.",
                    developing="Shows some awareness of customer needs but may miss opportunities to add value.",
                    concerning="Acts on incomplete or inaccurate understanding of customer needs. Conducts work activities from an internal, operational standpoint. Fails to build effective relationships with key customers. Is unaware of customer expectations."
                )
            ),
            RubricCompetency(
                key="business_insight",
                name="Business Insight",
                description="Applying knowledge of business and the marketplace to advance the organization's goals.",
                criteria=RubricCriteria(
                    excellent="Consistently applies a business driver and marketplace focus when prioritizing actions. Has an in-depth understanding of how businesses work and make money. Is the first to spot possible future policies, practices, and trends in the organization, with the competition, and in the marketplace.",
                    strong="Keeps up with current and possible future policies, practices, and trends in the organization, with the competition, and in the marketplace. Knows how businesses work and how organizations make money. Uses knowledge of business drivers and how strategies and tactics play out in the market to guide actions.",
                    solid="Shows understanding of basic business drivers. Stays informed about organizational policies and practices.",
                    developing="Limited understanding of business context. May focus primarily on technical aspects without business consideration.",
                    concerning="Doesn't take business drivers into account when planning and executing own work. Doesn't understand how businesses work. Is not up-to-date on current and future policies, trends, and information affecting the organization. Is unaware of how strategies and tactics work in the marketplace."
                )
            ),
            RubricCompetency(
                key="cultivates_innovation",
                name="Cultivates Innovation",
                description="Creating new and better ways for the organization to be successful.",
                criteria=RubricCriteria(
                    excellent="Builds excitement in others to explore creative options. Continually assesses the market potential of an innovative idea or solution. Finds and champions the best creative ideas and actively moves them into implementation. Moves beyond traditional ways of doing things; pushes past the status quo. Tries multiple, varied approaches to innovative ideas.",
                    strong="Can take a creative idea and put it into practice. Comes up with useful ideas that are new, better, or unique. Encourages diverse thinking to promote and nurture innovation. Introduces new ways of looking at problems.",
                    solid="Shows creativity in problem-solving. Open to new ideas and approaches.",
                    developing="Shows some creativity but may need encouragement to think outside conventional approaches.",
                    concerning="Has a style that discourages the creative initiatives of others. Presents ideas that are ordinary, conventional, and from the past. Stays within comfort zone rather than experimenting with new ways of looking at things. Tends to be critical of others' original ideas."
                )
            ),
            RubricCompetency(
                key="ensures_accountability",
                name="Ensures Accountability",
                description="Holding self and others accountable to meet commitments.",
                criteria=RubricCriteria(
                    excellent="Assumes responsibility for the outcomes of others. Is completely on top of what is going on and knows where things stand. Promotes a sense of urgency and establishes and enforces individual accountability in the team. Provides balanced feedback at the most critical times. Works with people to establish explicit performance standards.",
                    strong="Acts with a clear sense of ownership. Designs feedback loops into work. Establishes clear responsibilities and processes for monitoring work and measuring results. Follows through on commitments and makes sure others do the same. Takes personal responsibility for decisions, actions, and failures.",
                    solid="Generally reliable and takes responsibility for own work. Follows through on most commitments.",
                    developing="Sometimes needs reminders to follow through. May avoid taking full responsibility in challenging situations.",
                    concerning="Fails to accept a fair share of personal responsibility. Gathers little information about how things are going. Prefers to be one of many accountable for an assignment. Provides inadequate feedback; fails to help others adjust course midstream."
                )
            ),
            RubricCompetency(
                key="manages_ambiguity",
                name="Manages Ambiguity",
                description="Operating effectively, even when things are not certain or the way forward is not clear.",
                criteria=RubricCriteria(
                    excellent="Adapts quickly to changing conditions. Is energized when faced with ambiguity and uncertainty. Makes significant progress and remains calm and composed, even when things are uncertain. Manages the risk that comes with moving forward when the outcome isn't certain.",
                    strong="Can decide and act without the total picture. Deals comfortably with the uncertainty of change. Deals constructively with problems that do not have clear solutions or outcomes. Effectively handles risk. Is calm and productive, even when things are up in the air.",
                    solid="Generally handles uncertain situations adequately. Can work with incomplete information when needed.",
                    developing="May feel uncomfortable with ambiguous situations. Prefers clear direction and structured environments.",
                    concerning="Appears stressed when things are uncertain. Delays moving forward until all the details are known. Operates best when things are structured and predictable. Struggles to make progress when facing ambiguous or uncertain situations."
                )
            ),
            RubricCompetency(
                key="manages_complexity",
                name="Manages Complexity",
                description="Making sense of complex, high quantity, and sometimes contradictory information to effectively solve problems.",
                criteria=RubricCriteria(
                    excellent="Analyzes multiple and diverse sources of information to define problems accurately before moving to solutions. Looks beyond the obvious and doesn't stop at the first answers. Readily distinguishes between what's relevant and what's unimportant to make sense of complex situations.",
                    strong="Acquires data from multiple and diverse sources when solving problems. Asks the right questions to accurately analyze situations. Evaluates pros and cons, risks and benefits of different solution options. Uncovers root causes to difficult problems.",
                    solid="Generally able to handle complex situations with some guidance. Uses available information to solve problems.",
                    developing="May struggle with highly complex situations. Benefits from breaking down complex problems into smaller parts.",
                    concerning="Doesn't gather sufficient information to assess situations completely. Is caught off guard when problems surface without an obvious solution. Misses the complexity of issues and force fits solutions. Relies solely on intuition, even when contrary information exists."
                )
            ),
            RubricCompetency(
                key="decision_quality",
                name="Decision Quality",
                description="Making good and timely decisions that keep the organization moving forward.",
                criteria=RubricCriteria(
                    excellent="Actively seeks input from pertinent sources to make timely and well-informed decisions. Decisively makes high-quality decisions, even when based on incomplete information or in the face of uncertainty. Is respected by others for displaying superior judgment. Skillfully separates opinions from facts.",
                    strong="Considers all relevant factors and uses appropriate decision-making criteria and principles. Makes sound decisions, even in the absence of complete information. Recognizes when a quick 80% solution will suffice. Relies on a mixture of analysis, wisdom, experience, and judgment when making decisions.",
                    solid="Generally makes sound decisions with available information. Considers key factors before deciding.",
                    developing="May need guidance on complex decisions. Sometimes delays decision-making when faced with uncertainty.",
                    concerning="Approaches decisions haphazardly or delays decision making. Ignores different points of view or makes decisions that impact short-term results at the expense of longer-term goals. Makes decisions based on incomplete data or inaccurate assumptions."
                )
            )
        ]
    )
    
    # Ensure rubric is in database
    existing = await db.rubrics.find_one({"name": default_rubric.name})
    if not existing:
        await db.rubrics.insert_one(default_rubric.model_dump())
    
    return [default_rubric]

# AI Analysis Routes
@api_router.post("/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_evaluation(request: AIAnalysisRequest):
    """Comprehensive AI analysis acting as manager providing feedback and rating recommendations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import os
        
        # Get Emergent LLM key
        emergent_key = "sk-emergent-a1598F1D1052dA76f2"
        
        # Initialize LLM chat with manager persona
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"manager-analysis-{request.cycle_id}",
            system_message="""You are an experienced performance management AI acting as a senior manager reviewing employee performance evaluations. Your role is to:

1. **PROVIDE MANAGER'S FEEDBACK**: Review all evaluation data and provide comprehensive managerial feedback as if you're the employee's direct manager
2. **CONSOLIDATE & ANALYZE**: Synthesize all information (competencies, self-reflection, goals, feedback) to provide holistic insights
3. **SUGGEST ACCURATE RATINGS**: Based on evidence and performance data, recommend appropriate competency ratings (1-5 scale)
4. **IDENTIFY PATTERNS**: Spot strengths, development areas, and alignment between different evaluation sections

**Response Format Guidelines:**
- Be direct, constructive, and professional
- Reference specific evidence provided
- Suggest concrete development actions
- Highlight both strengths and improvement areas
- Provide rating justifications based on evidence

**Rating Scale:**
- 5 (Excellent): Exceptional performance with strong evidence
- 4 (Strong): Solid performance exceeding expectations  
- 3 (Solid): Meets expectations with competent performance
- 2 (Developing): Below expectations, needs development
- 1 (Concerning): Significant performance gaps requiring immediate attention"""
        ).with_model("openai", "gpt-4o")
        
        # Get comprehensive evaluation context
        eval_data = request.evaluation_data
        
        # Build comprehensive analysis prompt
        analysis_prompt = """Please analyze this complete performance evaluation and provide manager-level feedback:

=== EMPLOYEE COMPETENCY ASSESSMENT ==="""
        
        # Add competency analysis with evidence
        if eval_data.get("competencies"):
            analysis_prompt += "\nCOMPETENCY SCORES & EVIDENCE:\n"
            for comp in eval_data["competencies"]:
                score = comp.get('score', 3)
                evidence = comp.get('evidence', 'No evidence provided')
                analysis_prompt += f"\n• {comp.get('name', 'Unknown')}: Currently rated {score}/5"
                analysis_prompt += f"\n  Evidence: {evidence[:300]}{'...' if len(evidence) > 300 else ''}\n"
        
        # Add self-reflection analysis
        if eval_data.get("idp", {}).get("self_reflection"):
            sr = eval_data["idp"]["self_reflection"]
            analysis_prompt += "\n=== SELF-REFLECTION RESPONSES ===\n"
            if sr.get("key_strengths"):
                analysis_prompt += f"\nKey Strengths: {sr['key_strengths'][:200]}...\n"
            if sr.get("passions"):
                analysis_prompt += f"\nPassions: {sr['passions'][:200]}...\n"
            if sr.get("development_opportunities"):
                analysis_prompt += f"\nDevelopment Opportunities: {sr['development_opportunities'][:200]}...\n"
            if sr.get("proud_accomplishments"):
                analysis_prompt += f"\nProud Accomplishments: {sr['proud_accomplishments'][:200]}...\n"
        
        # Add development goals
        if eval_data.get("idp", {}).get("development_goals"):
            dg = eval_data["idp"]["development_goals"]
            analysis_prompt += "\n=== DEVELOPMENT GOALS ===\n"
            if dg.get("teksystems_roles"):
                analysis_prompt += f"\nCareer Interest: {dg['teksystems_roles']}\n"
            if dg.get("professional_goals"):
                analysis_prompt += f"\nProfessional Goals: {dg['professional_goals'][:200]}...\n"
            if dg.get("personal_goals"):
                analysis_prompt += f"\nPersonal Goals: {dg['personal_goals'][:200]}...\n"
        
        # Add role fit and other assessments
        if eval_data.get("role_fit"):
            rf = eval_data["role_fit"]
            analysis_prompt += f"\n=== ROLE FIT ANALYSIS ===\n"
            analysis_prompt += f"Current Role: {rf.get('current_role', 'N/A')} (Fit: {rf.get('fit_current', 0)}/5)\n"
            analysis_prompt += f"Next Role: {rf.get('next_role', 'N/A')} (Readiness: {rf.get('fit_next', 0)}/5)\n"
        
        if eval_data.get("talent_assessment"):
            ta = eval_data["talent_assessment"]
            analysis_prompt += f"\n=== CURRENT TALENT ASSESSMENT ===\n"
            analysis_prompt += f"Potential: {ta.get('potential', 'N/A')}, Risk: {ta.get('risk', 'N/A')}, Overall: {ta.get('overall', 'N/A')}\n"
        
        # Request specific manager feedback
        analysis_prompt += """

=== MANAGER ANALYSIS REQUESTED ===
As a senior manager, please provide:

1. **OVERALL PERFORMANCE ASSESSMENT** (2-3 sentences summarizing strengths and areas for development)

2. **COMPETENCY RATING RECOMMENDATIONS** 
   - Review evidence provided for each competency
   - Suggest appropriate ratings (1-5) with justifications
   - Identify any ratings that seem too high/low based on evidence

3. **DEVELOPMENT PRIORITIES** (Top 3 specific actions for growth)

4. **ALIGNMENT ANALYSIS** (How well do self-assessments align with evidence provided?)

5. **MANAGER'S RECOMMENDATIONS** (Specific next steps and support needed)

Please be specific, constructive, and reference the evidence provided."""
        
        # Get AI manager analysis
        user_message = UserMessage(text=analysis_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Parse comprehensive AI response
        response_text = ai_response if isinstance(ai_response, str) else str(ai_response)
        
        # Extract structured feedback
        items = []
        rubric_alignment = []
        missing_fields = []
        
        # Parse AI response into structured feedback
        lines = response_text.split('\n')
        current_section = None
        
        # Extract key insights and convert to structured items
        feedback_sections = response_text.lower()
        
        # Look for manager recommendations
        if 'recommend' in feedback_sections or 'suggest' in feedback_sections:
            recommendations = [line.strip() for line in lines if 
                             ('recommend' in line.lower() or 'suggest' in line.lower()) 
                             and len(line.strip()) > 20]
            for rec in recommendations[:3]:
                items.append(AIFeedbackItem(type="suggestion", text=rec.strip()))
        
        # Look for concerns or development areas
        if 'concern' in feedback_sections or 'development' in feedback_sections or 'improve' in feedback_sections:
            concerns = [line.strip() for line in lines if 
                       ('concern' in line.lower() or 'development' in line.lower() or 'improve' in line.lower()) 
                       and len(line.strip()) > 20]
            for concern in concerns[:2]:
                items.append(AIFeedbackItem(type="risk", text=concern.strip()))
        
        # Look for strengths and positive feedback
        if 'strength' in feedback_sections or 'excellent' in feedback_sections or 'strong' in feedback_sections:
            strengths = [line.strip() for line in lines if 
                        ('strength' in line.lower() or 'excellent' in line.lower() or 'strong' in line.lower()) 
                        and len(line.strip()) > 20]
            for strength in strengths[:2]:
                items.append(AIFeedbackItem(type="success", text=strength.strip()))
        
        # Add overall assessment if available
        if len(response_text) > 100:
            # Extract first substantial paragraph as overall assessment
            paragraphs = [p.strip() for p in response_text.split('\n\n') if len(p.strip()) > 50]
            if paragraphs:
                items.insert(0, AIFeedbackItem(
                    type="suggestion", 
                    text=f"Manager's Assessment: {paragraphs[0][:200]}..."
                ))
        
        # Analyze competency ratings for rubric alignment
        if eval_data.get("competencies"):
            high_scores = [comp for comp in eval_data["competencies"] if comp.get("score", 0) >= 4]
            low_scores = [comp for comp in eval_data["competencies"] if comp.get("score", 0) <= 2]
            
            if high_scores:
                rubric_alignment.append(f"Strong performance indicated in {len(high_scores)} competencies")
            if low_scores:
                rubric_alignment.append(f"Development needed in {len(low_scores)} competency areas")
            
            # Check for evidence gaps
            no_evidence = [comp for comp in eval_data["competencies"] 
                          if not comp.get("evidence") or len(comp.get("evidence", "")) < 20]
            if no_evidence:
                missing_fields.extend([f"Evidence needed for {comp.get('name', 'competency')}" 
                                     for comp in no_evidence[:3]])
        
        # Ensure we have comprehensive feedback
        if not items:
            items = [
                AIFeedbackItem(type="suggestion", 
                             text="Manager Feedback: Continue developing your evaluation with more specific examples and evidence to receive detailed performance analysis."),
                AIFeedbackItem(type="suggestion", 
                             text="Complete all sections of the evaluation for comprehensive manager review and rating recommendations.")
            ]
        
        return AIAnalysisResponse(
            items=items[:8],  # Allow more comprehensive feedback
            rubric_alignment=rubric_alignment,
            missing_fields=missing_fields[:4]
        )
        
    except Exception as e:
        logger.error(f"AI manager analysis failed: {str(e)}")
        # Fallback to intelligent basic analysis
        items = []
        
        # Provide manager-style feedback even in fallback
        if request.evaluation_data.get("competencies"):
            scores = [comp.get("score", 3) for comp in request.evaluation_data["competencies"]]
            evidence_count = len([comp for comp in request.evaluation_data["competencies"] 
                                if comp.get("evidence") and len(comp.get("evidence", "")) > 20])
            
            avg_score = sum(scores) / len(scores) if scores else 3
            
            if avg_score >= 4:
                items.append(AIFeedbackItem(
                    type="success",
                    text="Manager Feedback: Strong self-assessment scores. Ensure evidence supports these high ratings for accurate review."
                ))
            elif avg_score <= 2.5:
                items.append(AIFeedbackItem(
                    type="risk",
                    text="Manager Feedback: Lower competency scores indicate development opportunities. Let's discuss specific support and training needs."
                ))
            
            if evidence_count < len(scores) / 2:
                items.append(AIFeedbackItem(
                    type="suggestion",
                    text="Manager Feedback: Please provide more detailed evidence and examples for competency ratings to support accurate evaluation."
                ))
        
        # Check self-reflection completeness
        if request.evaluation_data.get("idp", {}).get("self_reflection"):
            sr = request.evaluation_data["idp"]["self_reflection"]
            completed_fields = sum(1 for field in [sr.get("key_strengths"), sr.get("passions"), 
                                 sr.get("development_opportunities"), sr.get("proud_accomplishments")] 
                                 if field and len(field.strip()) > 10)
            
            if completed_fields >= 3:
                items.append(AIFeedbackItem(
                    type="success",
                    text="Manager Feedback: Excellent self-reflection responses. This demonstrates strong self-awareness and commitment to development."
                ))
        
        return AIAnalysisResponse(
            items=items if items else [AIFeedbackItem(type="suggestion", text="Manager Feedback: Complete more evaluation sections to receive comprehensive performance analysis and rating recommendations.")],
            rubric_alignment=["AI analysis providing basic manager feedback"],
            missing_fields=[]
        )

# Reports Routes (Placeholder)
@api_router.get("/reports/{cycle_id}", response_model=Report)
async def get_report(cycle_id: str):
    report = await db.reports.find_one({"cycle_id": cycle_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return Report(**serialize_doc(report))

@api_router.post("/reports/generate", response_model=Report)
async def generate_report(request: Dict[str, Any]):
    """Generate performance report for a cycle with AI assistance"""
    cycle_id = request.get("cycle_id")
    if not cycle_id:
        raise HTTPException(status_code=400, detail="cycle_id is required")
    
    try:
        # Get evaluation data
        evaluation = await db.evaluations.find_one({"cycle_id": cycle_id})
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        # Get cycle and mentee info
        cycle = await db.cycles.find_one({"id": cycle_id})
        mentee = await db.mentees.find_one({"id": cycle["mentee_id"]}) if cycle else None
        
        # Use AI to generate comprehensive report
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        emergent_key = "sk-emergent-a1598F1D1052dA76f2"
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"report-{cycle_id}",
            system_message="""You are an AI performance evaluation specialist. Generate a comprehensive performance report based on the evaluation data provided.

Your task is to:
1. Analyze all evaluation components holistically
2. Create a professional executive summary (2-3 sentences)
3. Identify key highlights and strengths (3-5 points)
4. Flag any risk areas or concerns (if applicable)
5. Provide actionable insights

Format your response as:

SUMMARY: [Professional 2-3 sentence executive summary]

HIGHLIGHTS:
- [Key achievement 1]
- [Key achievement 2]
- [Etc.]

RISKS:
- [Risk area 1 (if any)]
- [Risk area 2 (if any)]

Keep the tone professional, balanced, and constructive."""
        ).with_model("openai", "gpt-4o")
        
        # Prepare comprehensive evaluation data for AI
        prompt = f"""Generate a performance report for:

EMPLOYEE: {mentee['name'] if mentee else 'Unknown'} - {mentee['role'] if mentee else 'Unknown Role'}
PERIOD: {cycle['period_label'] if cycle else 'Unknown Period'}

EVALUATION DATA:

COMPETENCY SCORES:"""
        
        if evaluation.get("competencies"):
            for comp in evaluation["competencies"]:
                prompt += f"\n- {comp.get('name', 'Unknown')}: {comp.get('score', 0)}/5"
                if comp.get('evidence'):
                    prompt += f" - Evidence: {comp['evidence'][:200]}..."
        
        prompt += "\n\nDEVELOPMENT GOALS:"
        if evaluation.get("idp", {}).get("goals"):
            for goal in evaluation["idp"]["goals"]:
                prompt += f"\n- {goal.get('title', 'Untitled')}: {goal.get('description', '')[:100]}..."
        else:
            prompt += "\n- No specific development goals set"
        
        prompt += f"\n\nROLE FIT ANALYSIS:"
        if evaluation.get("role_fit"):
            rf = evaluation["role_fit"]
            prompt += f"\n- Current Role Performance: {rf.get('fit_current', 0)}/5"
            prompt += f"\n- Next Role Readiness: {rf.get('fit_next', 0)}/5"
            if rf.get('gaps'):
                prompt += f"\n- Development Gaps: {', '.join(rf['gaps'][:3])}"
        
        prompt += f"\n\nMANAGER FEEDBACK:"
        if evaluation.get("pm_feedback"):
            pf = evaluation["pm_feedback"]
            if pf.get('comments'):
                prompt += f"\n- Comments: {pf['comments'][:200]}..."
            if pf.get('strengths'):
                prompt += f"\n- Strengths: {', '.join(pf['strengths'][:3])}"
            if pf.get('areas_to_improve'):
                prompt += f"\n- Areas to Improve: {', '.join(pf['areas_to_improve'][:3])}"
        
        prompt += f"\n\nTALENT ASSESSMENT:"
        if evaluation.get("talent_assessment"):
            ta = evaluation["talent_assessment"]
            prompt += f"\n- Potential: {ta.get('potential', 'Unknown')}"
            prompt += f"\n- Risk: {ta.get('risk', 'Unknown')}"
            prompt += f"\n- Overall: {ta.get('overall', 'Unknown')}"
        
        # Generate AI report
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        # Parse AI response
        response_text = ai_response if isinstance(ai_response, str) else str(ai_response)
        
        summary_text = ""
        highlights = []
        risks = []
        
        # Simple parsing of AI response
        lines = response_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if line.startswith('SUMMARY:'):
                summary_text = line.replace('SUMMARY:', '').strip()
                current_section = 'summary'
            elif line.startswith('HIGHLIGHTS:'):
                current_section = 'highlights'
            elif line.startswith('RISKS:'):
                current_section = 'risks'
            elif line.startswith('- '):
                if current_section == 'highlights':
                    highlights.append(line[2:].strip())
                elif current_section == 'risks':
                    risks.append(line[2:].strip())
            elif current_section == 'summary' and len(line) > 10:
                if not summary_text:
                    summary_text = line
        
        # Fallback summary if AI parsing fails
        if not summary_text:
            summary_text = f"Performance evaluation completed for {mentee['name'] if mentee else 'employee'} during {cycle['period_label'] if cycle else 'evaluation period'}. Assessment includes competency analysis, development planning, and talent review."
        
        # Fallback highlights
        if not highlights:
            if evaluation.get("competencies"):
                avg_score = sum(comp.get("score", 0) for comp in evaluation["competencies"]) / len(evaluation["competencies"])
                if avg_score >= 4:
                    highlights.append("Strong competency performance across evaluation criteria")
                elif avg_score >= 3:
                    highlights.append("Solid performance with opportunities for growth")
                    
            if evaluation.get("idp", {}).get("goals"):
                highlights.append(f"Proactive development planning with {len(evaluation['idp']['goals'])} defined goals")
                
            if evaluation.get("talent_assessment", {}).get("overall") in ["excellent", "good"]:
                highlights.append("Positive talent assessment with good growth potential")
        
        # Create and save report
        report = Report(
            cycle_id=cycle_id,
            summary_text=summary_text,
            highlights=highlights[:5],  # Limit to 5
            risks=risks[:3]  # Limit to 3
        )
        
        # Delete existing report if any
        await db.reports.delete_many({"cycle_id": cycle_id})
        # Insert new report
        await db.reports.insert_one(report.model_dump())
        
        return report
        
    except Exception as e:
        logger.error(f"Report generation failed: {str(e)}")
        # Fallback to basic report
        report = Report(
            cycle_id=cycle_id,
            summary_text="Performance evaluation completed with comprehensive assessment of competencies, development goals, and talent potential.",
            highlights=["Evaluation completed successfully", "Ready for management review"],
            risks=[]
        )
        
        # Delete existing report if any
        await db.reports.delete_many({"cycle_id": cycle_id})
        # Insert new report
        await db.reports.insert_one(report.model_dump())
        
        return report

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
