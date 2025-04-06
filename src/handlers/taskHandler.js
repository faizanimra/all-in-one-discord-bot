class TaskHandler {
    constructor(client) {
        this.client = client;
        this.tasks = new Map();
    }

    registerTask(task) {
        if (this.tasks.has(task.name)) {
            throw new Error(`Task ${task.name} is already registered`);
        }

        const interval = setInterval(() => {
            task.execute(this.client).catch(error => {
                console.error(`Error executing task ${task.name}:`, error);
            });
        }, task.interval);

        this.tasks.set(task.name, {
            task,
            interval
        });

        console.log(`Registered task: ${task.name}`);
    }

    stopTask(taskName) {
        const taskInfo = this.tasks.get(taskName);
        if (!taskInfo) return;

        clearInterval(taskInfo.interval);
        this.tasks.delete(taskName);
        console.log(`Stopped task: ${taskName}`);
    }

    stopAll() {
        for (const [taskName, taskInfo] of this.tasks) {
            clearInterval(taskInfo.interval);
            console.log(`Stopped task: ${taskName}`);
        }
        this.tasks.clear();
    }
}

export default TaskHandler;
