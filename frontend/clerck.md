 Pipeline display order (matches graph topology):

 Row 1 (single):   orchestrator
 Row 2 (parallel): intent_classifier | safety_checker | rag_retriever
 Row 3 (single):   confidence_evaluator
 Row 4 (branch):   reply_writer  OR  tavily_search → reply_writer  OR  escalation_packager
 Row 5 (single):   memory_manager

  Display labels mapping:

 ┌──────────────────────┬──────────────────────┬──────┐
 │      node_name       │    Display label     │ Icon │
 ├──────────────────────┼──────────────────────┼──────┤
 │ orchestrator         │ Intake Coordinator   │ 🏥   │
 ├──────────────────────┼──────────────────────┼──────┤
 │ intent_classifier    │ Intent Classifier    │ 🧠   │
 ├──────────────────────┼──────────────────────┼──────┤
 │ safety_checker       │ Safety Checker       │ 🛡️    │
 ├──────────────────────┼──────────────────────┼──────┤
 │ rag_retriever        │ Knowledge Base       │ 📚   │
 ├──────────────────────┼──────────────────────┼──────┤
 │ confidence_evaluator │ Confidence Evaluator │ ⚖️    │
 ├──────────────────────┼──────────────────────┼──────┤
 │ tavily_search        │ Web Search           │ 🌐   │
 ├──────────────────────┼──────────────────────┼──────┤
 │ reply_writer         │ Reply Writer         │ ✍️    │
 ├──────────────────────┼──────────────────────┼──────┤
 │ escalation_packager  │ Escalation Packager  │ 🚨   │
 ├──────────────────────┼──────────────────────┼──────┤
 │ memory_manager       │ Memory Manager       │ 💾   │
 └──────────────────────┴──────────────────────┴──────┘

frontend/src/app/patient/processing/[ticket_id]/page.tsx │ CREATE: agent pipeline visualization  

