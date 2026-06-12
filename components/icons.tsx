/**
 * Central icon module — Phosphor icons re-exported under the names the app
 * already uses (originally Lucide). Swapping `lucide-react` imports for
 * `@/components/icons` migrates the whole app to Phosphor with no other code
 * changes. Phosphor respects Tailwind `size-*` classes (CSS overrides the
 * intrinsic 1em width/height), so existing className usage keeps working.
 */
export {
  Pulse as Activity,
  ArrowUp,

  ArrowRight,
  ArrowLeft,
  SealCheck as BadgeCheck,
  CaretLeft as ChevronLeft,
  ArrowBendUpLeft as CornerDownLeft,
  PushPin as Pin,
  Check,

  CaretDown as ChevronDown,
  CaretUpDown as ChevronsUpDown,
  Code as Code2,
  Copy,
  ArrowSquareOut as ExternalLink,
  Eye,
  EyeSlash,
  FileText,
  ClipboardText as ClipboardList,
  ChartBar as BarChart3,
  DotsSixVertical as GripVertical,
  CheckCircle,
  TextAlignLeft as AlignLeft,
  Fire as Flame,

  FloppyDisk as Save,
  Gear as Settings,
  GearSix as Settings2,
  GitBranch,
  GitMerge,
  Image as ImageIcon,
  Paperclip,
  FilePdf,
  Tray as Inbox,
  Lock,
  SignOut as LogOut,
  SquaresFour as LayoutGrid,
  CircleNotch as Loader2,
  Envelope as Mail,
  ChatText as MessageSquare,
  ChatCircleDots as MessageSquarePlus,
  Plus,
  Rocket,
  MagnifyingGlass as Search,
  PaperPlaneTilt as Send,
  Sparkle as Sparkles,
  Trash as Trash2,
  UploadSimple as Upload,
  UserPlus,
  Users,
  Warning,
  X,
} from "@phosphor-icons/react/dist/ssr";

