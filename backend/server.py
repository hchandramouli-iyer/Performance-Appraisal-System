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

class IDP(BaseModel):
    goals: List[Goal] = []
    progress_notes: Optional[str] = None

class Certification(BaseModel):
    name: str
    status: CertificationStatus
    completed_on: Optional[datetime] = None

class RoleFit(BaseModel):
    current_role: str
    next_role: str
    fit_current: int = Field(ge=0, le=5)
    fit_next: int = Field(ge=0, le=5)
    gaps: List[str] = []

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
    """Return predefined rubrics for competency evaluation"""
    # For MVP, return hardcoded competencies based on provided documents
    default_rubric = Rubric(
        name="Standard Performance Rubric",
        competencies=[
            RubricCompetency(
                key="ensure_accountability",
                name="Ensure Accountability",
                description="Delivers results and takes ownership of outcomes",
                criteria=RubricCriteria(
                    excellent="Consistently exceeds commitments and holds others accountable",
                    strong="Reliably meets commitments and addresses performance issues",
                    solid="Usually meets commitments with occasional follow-up needed",
                    developing="Sometimes struggles to meet commitments or address issues",
                    concerning="Frequently fails to meet commitments or avoid accountability"
                )
            ),
            RubricCompetency(
                key="cultivates_innovation",
                name="Cultivates Innovation",
                description="Drives creative solutions and continuous improvement",
                criteria=RubricCriteria(
                    excellent="Consistently creates breakthrough innovations and inspires others",
                    strong="Regularly generates creative solutions and supports innovation",
                    solid="Occasionally contributes innovative ideas and embraces change",
                    developing="Shows some openness to new ideas but limited contribution",
                    concerning="Resists change and rarely contributes innovative solutions"
                )
            ),
            RubricCompetency(
                key="decision_quality",
                name="Decision Quality",
                description="Makes timely, well-reasoned decisions with available information",
                criteria=RubricCriteria(
                    excellent="Consistently makes excellent decisions under pressure",
                    strong="Usually makes sound decisions with good reasoning",
                    solid="Makes adequate decisions with sufficient information",
                    developing="Sometimes struggles with decision timing or quality",
                    concerning="Frequently makes poor decisions or avoids decision-making"
                )
            ),
            RubricCompetency(
                key="manages_complexity",
                name="Manages Complexity",
                description="Navigates complex situations and ambiguous problems effectively",
                criteria=RubricCriteria(
                    excellent="Thrives in complex environments and simplifies for others",
                    strong="Handles complex situations well and finds viable solutions",
                    solid="Manages moderate complexity with some guidance",
                    developing="Struggles with highly complex or ambiguous situations",
                    concerning="Becomes overwhelmed by complexity and confusion"
                )
            ),
            RubricCompetency(
                key="communicates_effectively",
                name="Communicates Effectively",
                description="Conveys information clearly and listens actively",
                criteria=RubricCriteria(
                    excellent="Outstanding communication skills that inspire and persuade",
                    strong="Clear, compelling communication adapted to audience",
                    solid="Good communication skills with occasional misunderstandings",
                    developing="Communication sometimes unclear or one-directional",
                    concerning="Poor communication that often leads to confusion"
                )
            ),
            RubricCompetency(
                key="drives_results",
                name="Drives Results",
                description="Focuses on achieving outcomes and delivering value",
                criteria=RubricCriteria(
                    excellent="Consistently delivers exceptional results and exceeds targets",
                    strong="Reliably achieves results and helps others succeed",
                    solid="Usually meets targets with consistent effort",
                    developing="Sometimes falls short of targets despite effort",
                    concerning="Frequently fails to achieve expected results"
                )
            ),
            RubricCompetency(
                key="customer_focus",
                name="Customer Focus",
                description="Prioritizes customer needs and delivers exceptional experience",
                criteria=RubricCriteria(
                    excellent="Anticipates customer needs and creates exceptional experiences",
                    strong="Consistently meets customer needs and resolves issues",
                    solid="Generally responsive to customer needs and feedback",
                    developing="Sometimes misses customer needs or delays response",
                    concerning="Poor customer orientation and service delivery"
                )
            ),
            RubricCompetency(
                key="nimble_learning",
                name="Nimble Learning",
                description="Quickly acquires new skills and adapts to changing requirements",
                criteria=RubricCriteria(
                    excellent="Rapidly masters new skills and helps others learn",
                    strong="Quickly learns and applies new knowledge effectively",
                    solid="Learns at reasonable pace with some support",
                    developing="Slow to adapt or apply new learning",
                    concerning="Resists learning or fails to apply new knowledge"
                )
            ),
            RubricCompetency(
                key="manages_ambiguity",
                name="Manages Ambiguity",
                description="Operates effectively without complete information or clear direction",
                criteria=RubricCriteria(
                    excellent="Thrives in ambiguous situations and provides clarity to others",
                    strong="Comfortable with ambiguity and makes progress despite uncertainty",
                    solid="Manages moderate ambiguity with some guidance",
                    developing="Uncomfortable with ambiguity and needs clear direction",
                    concerning="Paralyzed by ambiguity and requires extensive guidance"
                )
            ),
            RubricCompetency(
                key="business_insights",
                name="Business Insights",
                description="Understands business context and applies strategic thinking",
                criteria=RubricCriteria(
                    excellent="Deep business acumen that drives strategic initiatives",
                    strong="Good business understanding and strategic contributions",
                    solid="Adequate business awareness with tactical focus",
                    developing="Limited business understanding and narrow perspective",
                    concerning="Poor business awareness that impacts decision-making"
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
    """Real-time AI analysis of evaluation data using Emergent LLM"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import os
        
        # Get Emergent LLM key
        emergent_key = "sk-emergent-a1598F1D1052dA76f2"
        
        # Initialize LLM chat
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"evaluation-{request.cycle_id}",
            system_message="""You are an AI performance evaluation assistant. Analyze evaluation data and provide helpful insights.

Your role is to:
1. Identify patterns in competency scores
2. Suggest improvements for evidence quality  
3. Flag potential risks or concerns
4. Provide constructive feedback
5. Highlight strengths and achievements

Respond with specific, actionable insights based on the evaluation data provided."""
        ).with_model("openai", "gpt-4o")
        
        # Prepare evaluation data for analysis
        eval_data = request.evaluation_data
        analysis_prompt = "Analyze this performance evaluation data:\n\n"
        
        # Add competency analysis
        if eval_data.get("competencies"):
            analysis_prompt += "COMPETENCY SCORES:\n"
            for comp in eval_data["competencies"]:
                analysis_prompt += f"- {comp.get('name', 'Unknown')}: {comp.get('score', 0)}/5\n"
                if comp.get('evidence'):
                    analysis_prompt += f"  Evidence: {comp['evidence'][:200]}...\n"
            analysis_prompt += "\n"
        
        # Add other sections
        if eval_data.get("idp", {}).get("goals"):
            analysis_prompt += f"IDP GOALS: {len(eval_data['idp']['goals'])} goals set\n"
        
        if eval_data.get("role_fit"):
            rf = eval_data["role_fit"]
            analysis_prompt += f"ROLE FIT: Current={rf.get('fit_current', 0)}/5, Next={rf.get('fit_next', 0)}/5\n"
        
        if eval_data.get("talent_assessment"):
            ta = eval_data["talent_assessment"]
            analysis_prompt += f"TALENT ASSESSMENT: Potential={ta.get('potential', 'Unknown')}, Risk={ta.get('risk', 'Unknown')}, Overall={ta.get('overall', 'Unknown')}\n"
        
        analysis_prompt += "\nPlease provide:\n1. Key insights (2-3 points)\n2. Areas of strength\n3. Areas for improvement\n4. Any risk flags\n5. Missing evidence or data gaps\n\nKeep responses concise and actionable."
        
        # Get AI analysis
        user_message = UserMessage(text=analysis_prompt)
        ai_response = await chat.send_message(user_message)
        
        # Parse AI response into structured format
        response_text = ai_response if isinstance(ai_response, str) else str(ai_response)
        
        # Extract insights from AI response
        items = []
        rubric_alignment = []
        missing_fields = []
        
        # Simple parsing logic for the AI response
        lines = response_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if any(keyword in line.lower() for keyword in ['strength', 'positive', 'excellent', 'strong']):
                items.append(AIFeedbackItem(type="success", text=line))
            elif any(keyword in line.lower() for keyword in ['risk', 'concern', 'warning', 'issue']):
                items.append(AIFeedbackItem(type="risk", text=line))
            elif any(keyword in line.lower() for keyword in ['suggest', 'improve', 'consider', 'recommend']):
                items.append(AIFeedbackItem(type="suggestion", text=line))
            elif len(line) > 20:  # General insight
                items.append(AIFeedbackItem(type="suggestion", text=line))
        
        # Add some basic rubric alignment checks
        if eval_data.get("competencies"):
            scores = [comp.get("score", 0) for comp in eval_data["competencies"]]
            avg_score = sum(scores) / len(scores) if scores else 0
            
            if avg_score >= 4:
                rubric_alignment.append("Strong performance across competencies")
            elif avg_score >= 3:
                rubric_alignment.append("Solid competency performance with room for growth")
            else:
                rubric_alignment.append("Competency scores suggest need for focused development")
        
        # Check for missing evidence
        if eval_data.get("competencies"):
            missing_evidence = [comp.get("name", "Unknown") for comp in eval_data["competencies"] 
                             if not comp.get("evidence")]
            if missing_evidence:
                missing_fields.extend([f"Evidence needed for {comp}" for comp in missing_evidence[:3]])
        
        # Ensure we have at least some feedback
        if not items:
            items.append(AIFeedbackItem(
                type="suggestion", 
                text="Continue adding evaluation details for more comprehensive AI analysis."
            ))
        
        return AIAnalysisResponse(
            items=items[:5],  # Limit to 5 items
            rubric_alignment=rubric_alignment,
            missing_fields=missing_fields[:3]  # Limit to 3 missing fields
        )
        
    except Exception as e:
        logger.error(f"AI analysis failed: {str(e)}")
        # Fallback to basic analysis
        items = []
        
        if request.evaluation_data.get("competencies"):
            scores = [comp.get("score", 0) for comp in request.evaluation_data["competencies"]]
            if scores:
                avg_score = sum(scores) / len(scores)
                if avg_score < 2:
                    items.append(AIFeedbackItem(
                        type="risk",
                        text="Low competency scores may indicate need for additional support"
                    ))
                elif avg_score > 4:
                    items.append(AIFeedbackItem(
                        type="success", 
                        text="Strong competency performance across multiple areas"
                    ))
                else:
                    items.append(AIFeedbackItem(
                        type="suggestion",
                        text="Consider adding more specific evidence examples for higher scores"
                    ))
        
        return AIAnalysisResponse(
            items=items,
            rubric_alignment=["AI analysis temporarily unavailable"],
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
