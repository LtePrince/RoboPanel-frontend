// Mirrors RoboPanel-backend schema (internal/robot/schema, internal/record/schema).

export interface JointState {
  position: number[]
  velocity: number[]
  effort: number[]
}

export interface CartesianState {
  x: number
  y: number
  z: number
  qx: number
  qy: number
  qz: number
  qw: number
}

export interface BaseState {
  pos_x: number
  pos_y: number
  yaw: number
  vel_x: number
  vel_theta: number
}

export interface NavState {
  nav_status: number
  map_status: number
  power: number
  current_pos_x: number
  current_pos_y: number
  current_angle: number
  busy_status: number
}

export interface SimState {
  suite: string
  task_id: number
  task: string
  step: number
  done: boolean
  success: boolean
}

export interface RobotState {
  timestamp: number
  arm_connected: boolean
  base_connected: boolean
  joint_state: JointState
  cartesian_state: CartesianState
  base_state: BaseState | null
  nav_state: NavState | null
  sim?: SimState // present only on the sim backend
}

// GET /robot/info — model descriptor (sim backend; absent on the arm).
export interface RobotInfo {
  model: string
  display_name: string
  dof: number
  joint_names: string[]
  has_base: boolean
  has_nav: boolean
  cameras: { name: string; width: number; height: number }[]
  teleop: { enabled: boolean; modes: string[]; gripper: boolean }
  record: { enabled: boolean }
}

export interface SimTasks {
  suites: string[]
  current: { suite: string; task_id: number; tasks: string[] }
}

export interface DemoFile {
  name: string
  size: number
}

export interface Demo {
  name: string
  created_at: number
  files: DemoFile[]
}

// Generic API envelope: { code, message, data }.
export interface ApiResponse<T> {
  code: string
  message: string
  data?: T
}

export interface RecordStartResp {
  demo_num: number
  demo_dir: string
  pid: number
}

export interface RecordStatusResp {
  running: boolean
  pid?: number
}

export interface DemoListResp {
  demos: Demo[]
  total: number
}
