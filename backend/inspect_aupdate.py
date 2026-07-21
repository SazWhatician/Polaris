import asyncio
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph

class State(dict):
    pass

async def main():
    builder = StateGraph(State)
    builder.add_node("node1", lambda x: x)
    builder.add_edge("node1", "__end__")
    builder.set_entry_point("node1")
    graph = builder.compile(checkpointer=MemorySaver())

    config = {"configurable": {"thread_id": "test"}}
    
    # 1. Update state without as_node
    await graph.aupdate_state(config, {"foo": "bar"})
    snap1 = await graph.aget_state(config)
    print("Snap1 next:", snap1.next)

    # 2. Update state with as_node
    await graph.aupdate_state(config, {"foo": "bar"}, as_node="node1")
    snap2 = await graph.aget_state(config)
    print("Snap2 next:", snap2.next)

    # 3. Update state with as_node="__end__"
    try:
        await graph.aupdate_state(config, {"foo": "bar"}, as_node="__end__")
        snap3 = await graph.aget_state(config)
        print("Snap3 next:", snap3.next)
    except Exception as e:
        print("Snap3 failed:", e)

if __name__ == "__main__":
    asyncio.run(main())
